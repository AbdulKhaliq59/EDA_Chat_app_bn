import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

@Entity('media_assets')
@Index(['uploadedBy'])
@Index(['type'])
@Index(['status'])
@Index(['publicId'], { unique: true })
export class MediaAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar')
  publicId!: string;

  @Column({ type: 'enum', enum: MediaType })
  type!: MediaType;

  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.UPLOADING })
  status!: MediaStatus;

  @Column('varchar')
  url!: string;

  @Column('varchar')
  secureUrl!: string;

  @Column('varchar', { nullable: true })
  format?: string;

  @Column('integer', { nullable: true })
  width?: number;

  @Column('integer', { nullable: true })
  height?: number;

  @Column('integer', { nullable: true })
  duration?: number;

  @Column('integer')
  fileSize!: number;

  @Column('varchar')
  mimeType!: string;

  @Column('varchar')
  originalName!: string;

  @Column('uuid')
  uploadedBy!: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;
}
