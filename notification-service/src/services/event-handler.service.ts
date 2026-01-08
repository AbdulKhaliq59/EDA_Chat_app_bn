import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class EventHandlerService implements OnModuleInit {
  private readonly logger = new Logger(EventHandlerService.name);

  constructor(
    private notificationService: NotificationService,
    private kafkaConsumer: KafkaConsumerService,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.registerMessageCreatedHandler();
    this.registerMessageUpdatedHandler();
    this.registerPresenceUpdatedHandler();
    this.logger.log('✅ Event handlers registered');
  }

  private registerMessageCreatedHandler() {
    this.kafkaConsumer.registerHandler('message.created', async (event) => {
      try {
        const { data } = event;
        
        // Create notification for receiver
        await this.notificationService.createNotification(
          data.receiverId,
          NotificationType.NEW_MESSAGE,
          'New Message',
          `You have a new message`,
          {
            messageId: data.messageId,
            senderId: data.senderId,
            conversationId: data.conversationId,
            preview: data.content.substring(0, 100),
          },
        );

        this.logger.log(`Created new message notification for user ${data.receiverId}`);
      } catch (error) {
        this.logger.error('Failed to handle message.created event', error);
      }
    });
  }

  private registerMessageUpdatedHandler() {
    this.kafkaConsumer.registerHandler('message.updated', async (event) => {
      try {
        const { data } = event;

        if (data.readAt) {
          // Optionally create notification for sender that message was read
          // For now, we'll just log it
          this.logger.log(`Message ${data.messageId} was read`);
        }
      } catch (error) {
        this.logger.error('Failed to handle message.updated event', error);
      }
    });
  }

  private registerPresenceUpdatedHandler() {
    this.kafkaConsumer.registerHandler('presence.updated', async (event) => {
      try {
        const { data } = event;
        this.logger.log(`User ${data.userId} presence updated to ${data.status}`);
        // Can be used to notify friends/contacts about status changes
      } catch (error) {
        this.logger.error('Failed to handle presence.updated event', error);
      }
    });
  }
}
