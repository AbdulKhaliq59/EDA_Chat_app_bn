// Kafka Event Topics
export const KAFKA_TOPICS = {
  MESSAGE_CREATED: 'message.created',
  MESSAGE_UPDATED: 'message.updated',
  MESSAGE_DELETED: 'message.deleted',
  PRESENCE_UPDATED: 'presence.updated',
  USER_REGISTERED: 'user.registered',
  NOTIFICATION_CREATED: 'notification.created',
  MEDIA_UPLOADED: 'media.uploaded',
  MEDIA_DELETED: 'media.deleted',
  PROFILE_UPDATED: 'profile.updated',
  PROFILE_PICTURE_UPDATED: 'profile.picture.updated',
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

// Media Events
export interface MediaUploadedEvent extends BaseEvent {
  eventType: 'media.uploaded';
  data: {
    mediaAssetId: string;
    publicId: string;
    type: string;
    url: string;
    secureUrl: string;
    uploadedBy: string;
    metadata: {
      fileSize: number;
      mimeType: string;
      originalName: string;
      width?: number;
      height?: number;
      duration?: number;
    };
    createdAt: Date;
  };
}

export interface MediaDeletedEvent extends BaseEvent {
  eventType: 'media.deleted';
  data: {
    mediaAssetId: string;
    publicId: string;
    deletedBy: string;
    deletedAt: Date;
  };
}

// Profile Events
export interface ProfileUpdatedEvent extends BaseEvent {
  eventType: 'profile.updated';
  data: {
    profileId: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    phoneNumber?: string;
    location?: string;
    website?: string;
    updatedAt: Date;
  };
}

export interface ProfilePictureUpdatedEvent extends BaseEvent {
  eventType: 'profile.picture.updated';
  data: {
    profileId: string;
    userId: string;
    mediaAssetId: string;
    publicId: string;
    url: string;
    secureUrl: string;
    previousMediaAssetId?: string;
    updatedAt: Date;
  };
}

// Union type for all events
export type KafkaEvent =
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | PresenceUpdatedEvent
  | UserRegisteredEvent
  | NotificationCreatedEvent
  | MediaUploadedEvent
  | MediaDeletedEvent
  | ProfileUpdatedEvent
  | ProfilePictureUpdatedEvent;
