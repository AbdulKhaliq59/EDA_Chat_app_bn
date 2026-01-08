// Media Types
export enum MediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    AUDIO = 'AUDIO',
    DOCUMENT = 'DOCUMENT',
    VOICE_MESSAGE = 'VOICE_MESSAGE',
    ATTACHMENT = 'ATTACHMENT',
}

export enum MediaStatus {
    UPLOADING = 'UPLOADING',
    UPLOADED = 'UPLOADED',
    PROCESSING = 'PROCESSING',
    READY = 'READY',
    FAILED = 'FAILED',
    DELETED = 'DELETED',
}

export interface MediaMetadata {
    width?: number;
    height?: number;
    duration?: number;
    fileSize: number;
    mimeType: string;
    originalName: string;
}

export interface CloudinaryAsset {
    publicId: string;
    url: string;
    secureUrl: string;
    format: string;
    type: string;
    bytes: number;
    width?: number;
    height?: number;
    duration?: number;
    createdAt: Date;
}

export interface MediaAsset {
    id: string;
    publicId: string;
    type: MediaType;
    status: MediaStatus;
    url: string;
    secureUrl: string;
    metadata: MediaMetadata;
    uploadedBy: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}

export interface CreateMediaAssetRequest {
    file: {
        buffer: any;
        originalname: string;
        mimetype: string;
        size: number;
    };
    mediaType: MediaType;
    uploadedBy: string;
}

export interface MediaUploadResponse {
    id: string;
    url: string;
    secureUrl: string;
    publicId: string;
    type: MediaType;
    status: MediaStatus;
}

// Message Attachment Types
export interface MessageAttachment {
    id: string;
    messageId: string;
    mediaAssetId: string;
    type: MediaType;
    url: string;
    secureUrl: string;
    metadata: MediaMetadata;
    createdAt: Date;
}

export interface CreateMessageWithAttachmentsRequest {
    content?: string;
    receiverId: string;
    conversationId?: string;
    attachments?: string[]; // Array of mediaAssetIds
}
