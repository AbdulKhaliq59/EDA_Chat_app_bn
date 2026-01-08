import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private messageHandlers: Map<string, (data: any) => Promise<void>> = new Map();

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'notification-service',
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092'],
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: 'notification-service-group',
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  async onModuleInit() {
    try {
      await this.consumer.connect();
      this.logger.log('✅ Kafka Consumer connected successfully');

      // Subscribe to all relevant topics
      await this.consumer.subscribe({
        topics: ['message.created', 'message.updated', 'presence.updated'],
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.logger.log('✅ Kafka Consumer started listening');
    } catch (error) {
      this.logger.error('❌ Failed to start Kafka Consumer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.consumer.disconnect();
      this.logger.log('Kafka Consumer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka Consumer', error);
    }
  }

  registerHandler(eventType: string, handler: (data: any) => Promise<void>): void {
    this.messageHandlers.set(eventType, handler);
    this.logger.log(`Handler registered for event type: ${eventType}`);
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        this.logger.warn('⚠️ Received message with null value');
        return;
      }

      const eventType = message.headers?.['event-type']?.toString();
      const value = JSON.parse(message.value.toString());

      this.logger.log(`📨 Received event from ${topic}: ${eventType}`);

      const handler = this.messageHandlers.get(eventType || value.eventType);

      if (handler) {
        await handler(value);
        this.logger.log(`✅ Processed event: ${eventType}`);
      } else {
        this.logger.warn(`⚠️ No handler found for event type: ${eventType}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to process message from ${topic}`, error);
      // Don't throw - continue processing other messages
    }
  }
}
