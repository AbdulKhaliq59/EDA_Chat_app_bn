// Kafka Event Topics
export const KAFKA_TOPICS = {
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  PRESENCE_UPDATED: 'presence.updated',
  USER_REGISTERED: 'user.registered',
  NOTIFICATION_CREATED: 'notification.created',
} as const;

// Base Event Interface
export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
}

// Message Events
export interface MessageCreatedEvent extends BaseEvent {
  eventType: 'message.created';
  data: {
    messageId: string;
    content: string;
    senderId: string;
    receiverId: string;
    conversationId: string;
    createdAt: Date;
  };
}

export interface MessageUpdatedEvent extends BaseEvent {
  eventType: 'message.updated';
  data: {
    messageId: string;
    content?: string;
    readAt?: Date;
    updatedAt: Date;
  };
}

export interface MessageDeletedEvent extends BaseEvent {
  eventType: 'message.deleted';
  data: {
    messageId: string;
    deletedAt: Date;
  };
}

// Presence Events
export interface PresenceUpdatedEvent extends BaseEvent {
  eventType: 'presence.updated';
  data: {
    userId: string;
    status: string;
    lastSeenAt: Date;
  };
}

// User Events
export interface UserRegisteredEvent extends BaseEvent {
  eventType: 'user.registered';
  data: {
    userId: string;
    email: string;
    username: string;
    createdAt: Date;
  };
}

// Notification Events
export interface NotificationCreatedEvent extends BaseEvent {
  eventType: 'notification.created';
  data: {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
    createdAt: Date;
  };
}

// Union type for all events
export type KafkaEvent =
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | PresenceUpdatedEvent
  | UserRegisteredEvent
  | NotificationCreatedEvent;
