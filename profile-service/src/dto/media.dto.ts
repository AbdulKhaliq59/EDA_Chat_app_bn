import { IsEnum, IsString, IsNumber, IsOptional } from 'class-validator';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  VOICE_MESSAGE = 'VOICE_MESSAGE',
  ATTACHMENT = 'ATTACHMENT',
}

export class MediaUploadResponseDto {
  @IsString()
  id!: string;

  @IsString()
  publicId!: string;

  @IsString()
  url!: string;

  @IsString()
  secureUrl!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  status!: string;

  @IsOptional()
  metadata!: {
    fileSize: number;
    mimeType: string;
    originalName: string;
    width?: number;
    height?: number;
    duration?: number;
  };

  @IsOptional()
  createdAt!: Date;
}

export class MediaAssetDto {
  @IsString()
  id!: string;

  @IsString()
  publicId!: string;

  @IsEnum(MediaType)
  type!: MediaType;

  @IsString()
  status!: string;

  @IsString()
  url!: string;

  @IsString()
  secureUrl!: string;

  @IsNumber()
  fileSize!: number;

  @IsString()
  mimeType!: string;

  @IsString()
  originalName!: string;

  @IsString()
  uploadedBy!: string;

  @IsOptional()
  createdAt!: Date;

  @IsOptional()
  updatedAt!: Date;
}
