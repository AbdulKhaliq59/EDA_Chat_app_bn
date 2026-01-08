import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';

export enum AttachmentType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  VOICE_MESSAGE = 'VOICE_MESSAGE',
  ATTACHMENT = 'ATTACHMENT',
}

@Entity('message_attachments')
@Index(['messageId'])
@Index(['mediaAssetId'])
export class MessageAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  messageId: string;

  @Column('uuid')
  mediaAssetId: string;

  @Column({ type: 'enum', enum: AttachmentType })
  type: AttachmentType;

  @Column('varchar')
  url: string;

  @Column('varchar')
  secureUrl: string;

  @Column('varchar')
  publicId: string;

  @Column({ type: 'integer', nullable: true })
  width?: number;

  @Column({ type: 'integer', nullable: true })
  height?: number;

  @Column({ type: 'integer', nullable: true })
  duration?: number;

  @Column('integer')
  fileSize: number;

  @Column('varchar')
  mimeType: string;

  @Column('varchar')
  originalName: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Message, (message) => message.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'messageId' })
  message: Message;
}
