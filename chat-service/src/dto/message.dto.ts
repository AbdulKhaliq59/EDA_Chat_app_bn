import { IsString, IsNotEmpty, IsUUID, IsOptional, IsArray } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsUUID()
  @IsNotEmpty()
  receiverId: string;

  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsOptional()
  @IsArray()
  attachmentMediaIds?: string[]; // Array of mediaAssetIds from profile-service
}

export class MessageAttachmentDto {
  @IsString()
  id!: string;

  @IsString()
  messageId!: string;

  @IsString()
  mediaAssetId!: string;

  @IsString()
  type!: string;

  @IsString()
  url!: string;

  @IsString()
  secureUrl!: string;

  @IsString()
  publicId!: string;

  fileSize!: number;

  @IsString()
  mimeType!: string;

  @IsString()
  originalName!: string;

  @IsOptional()
  metadata?: Record<string, any>;

  createdAt!: Date;
}

export class MessageResponseDto {
  @IsString()
  id!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsString()
  senderId!: string;

  @IsString()
  receiverId!: string;

  @IsString()
  conversationId!: string;

  @IsArray()
  attachments!: MessageAttachmentDto[];

  @IsOptional()
  readAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export class MarkMessageReadDto {
  @IsUUID()
  @IsNotEmpty()
  messageId: string;
}

export class GetMessagesDto {
  @IsUUID()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  page?: string;

  @IsString()
  limit?: string;
}
