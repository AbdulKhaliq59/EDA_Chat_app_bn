import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, ProducerRecord, Partitioners } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'chat-service',
      brokers: [this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092'],
      retry: {
        retries: 5,
        initialRetryTime: 300,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka Producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka Producer disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect Kafka Producer', error);
    }
  }

  async produce(topic: string, event: any): Promise<void> {
    try {
      const message = {
        eventId: uuidv4(),
        timestamp: new Date(),
        version: '1.0',
        ...event,
      };

      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: event.data?.messageId || event.data?.userId || uuidv4(),
            value: JSON.stringify(message),
            headers: {
              'event-type': event.eventType,
              'event-id': message.eventId,
            },
          },
        ],
      };

      await this.producer.send(record);
      this.logger.log(`✅ Event published to ${topic}: ${event.eventType}`);
    } catch (error) {
      this.logger.error(`❌ Failed to produce event to ${topic}`, error);
      throw error;
    }
  }
}
