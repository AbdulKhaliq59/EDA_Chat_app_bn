// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPayload {
  userId: string;
  email: string;
  username: string;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserPayload;
}

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

// Message Types
export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}

export interface CreateMessageRequest {
  content: string;
  receiverId: string;
  conversationId?: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  conversationId: string;
  createdAt: Date;
}

// Conversation Types
export interface Conversation {
  id: string;
  participants: string[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Presence Types
export enum PresenceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
}

export interface Presence {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: Date;
}

export interface UpdatePresenceRequest {
  userId: string;
  status: PresenceStatus;
}

// Notification Types
export enum NotificationType {
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationRequest {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

// Pagination
export interface PaginationRequest {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Export media and profile types
export * from './media.types';
export * from './profile.types';
