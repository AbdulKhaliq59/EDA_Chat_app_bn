import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Partitioners } from 'kafkajs';
import { KAFKA_TOPICS } from './topics';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private configService: ConfigService) {
    const brokers = (this.configService.get<string>('KAFKA_BROKER') || 'localhost:9092').split(',');
    
    this.kafka = new Kafka({
      clientId: 'presence-service',
      brokers,
      retry: {
        retries: 5,
        initialRetryTime: 300,
        multiplier: 2,
      },
    });

    this.producer = this.kafka.producer({
      createPartitioner: Partitioners.LegacyPartitioner,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('✅ Kafka Producer connected');
    } catch (error) {
      this.logger.error('❌ Failed to connect Kafka Producer', error);
      // Continue without Kafka - service can still function
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    this.logger.log('Kafka Producer disconnected');
  }

  async publishPresenceUpdatedEvent(userId: string, status: string, lastSeenAt: Date) {
    const event = {
      eventId: uuidv4(),
      eventType: 'presence.updated',
      timestamp: new Date(),
      version: '1.0',
      data: {
        userId,
        status,
        lastSeenAt,
      },
    };

    try {
      await this.producer.send({
        topic: KAFKA_TOPICS.PRESENCE_UPDATED,
        messages: [
          {
            key: userId,
            value: JSON.stringify(event),
            headers: {
              eventType: 'presence.updated',
            },
          },
        ],
      });

      this.logger.log(`Published presence.updated event for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to publish presence.updated event', error);
      // Don't throw - continue even if Kafka is down
    }
  }
}
