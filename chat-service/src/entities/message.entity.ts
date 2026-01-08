import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { MessageAttachment } from './message-attachment.entity';

@Entity('messages')
@Index(['senderId'])
@Index(['receiverId'])
@Index(['conversationId'])
@Index(['conversationId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { nullable: true })
  content?: string | null;

  @Column('uuid')
  senderId!: string;

  @Column('uuid')
  receiverId!: string;

  @Column('uuid')
  conversationId!: string;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'boolean', default: false })
  deleted!: boolean;

  @OneToMany(() => MessageAttachment, (attachment) => attachment.message, {
    cascade: true,
    eager: false,
  })
  @JoinColumn()
  attachments: MessageAttachment[];
}
