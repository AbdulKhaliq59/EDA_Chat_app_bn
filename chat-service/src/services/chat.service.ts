import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import { MessageAttachment } from '../entities/message-attachment.entity';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { CreateMessageDto, GetMessagesDto, MessageResponseDto } from '../dto/message.dto';
import { KAFKA_TOPICS } from '../kafka/topics';
import { CloudinaryService } from './cloudinary.service';
import { AttachmentType } from '../entities/message-attachment.entity';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(MessageAttachment)
    private attachmentRepository: Repository<MessageAttachment>,
    private kafkaProducer: KafkaProducerService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async createMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const { content, receiverId, conversationId } = createMessageDto;

    // Validate that either content or attachments exist
    if (!content && (!createMessageDto.attachmentMediaIds || createMessageDto.attachmentMediaIds.length === 0)) {
      throw new BadRequestException(
        'Message must have either content or attachments',
      );
    }

    // Verify conversation exists and user is participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participants.includes(senderId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Create message
    const message = this.messageRepository.create({
      content: content || null,
      senderId,
      receiverId,
      conversationId,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Handle attachments if provided
    if (createMessageDto.attachmentMediaIds && createMessageDto.attachmentMediaIds.length > 0) {
      // Note: In production, you'd verify these media assets exist in the profile service
      // For now, we create attachments with the provided IDs
      // This would need to be integrated with the profile service's media assets

      const attachments = createMessageDto.attachmentMediaIds.map((mediaId) =>
        this.attachmentRepository.create({
          messageId: savedMessage.id,
          mediaAssetId: mediaId,
          // Other fields would be populated from profile service
        }),
      );

      await this.attachmentRepository.save(attachments);
    }

    // Update conversation
    const lastMessageText =
      content || `[${createMessageDto.attachmentMediaIds?.length || 0} attachment(s)]`;
    await this.conversationRepository.update(conversationId, {
      lastMessage: lastMessageText,
      lastMessageAt: savedMessage.createdAt,
      lastMessageSenderId: senderId,
    });

    // Publish event to Kafka (async, fire-and-forget)
    this.publishMessageCreatedEvent(savedMessage, createMessageDto.attachmentMediaIds).catch(
      (error) => {
        this.logger.error('Failed to publish message created event', error);
      },
    );

    // Load attachments and return
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['attachments'],
    });

    if (!fullMessage) {
      throw new Error('Failed to retrieve saved message');
    }

    return this.messageToDto(fullMessage);
  }

  async getMessages(getMessagesDto: GetMessagesDto, userId: string) {
    const { conversationId, page = '1', limit = '50' } = getMessagesDto;

    // Verify user is participant
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (!conversation.participants.includes(userId)) {
      throw new ForbiddenException('You are not a participant in this conversation');
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [messages, total] = await this.messageRepository.findAndCount({
      where: { conversationId, deleted: false },
      relations: ['attachments'],
      order: { createdAt: 'DESC' },
      skip,
      take: limitNum,
    });

    return {
      data: messages.map((m) => this.messageToDto(m)).reverse(),
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async uploadAttachment(
    file: Express.Multer.File,
    attachmentType: AttachmentType,
    userId: string,
  ): Promise<any> {
    return this.cloudinaryService.uploadAttachment(file, attachmentType, userId);
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<MessageResponseDto> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['attachments'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only receiver can mark as read
    if (message.receiverId !== userId) {
      throw new ForbiddenException('You can only mark your own messages as read');
    }

    if (message.readAt) {
      return this.messageToDto(message); // Already read
    }

    message.readAt = new Date();
    const updatedMessage = await this.messageRepository.save(message);

    // Publish event to Kafka (async)
    this.publishMessageUpdatedEvent(updatedMessage).catch((error) => {
      this.logger.error('Failed to publish message updated event', error);
    });

    return this.messageToDto(updatedMessage);
  }

  async getUserConversations(userId: string) {
    const conversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where(':userId = ANY(conversation.participants)', { userId })
      .orderBy('conversation.lastMessageAt', 'DESC')
      .getMany();

    return conversations;
  }

  async createConversation(participants: string[]): Promise<Conversation> {
    // Check if conversation already exists
    const existingConversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.participants @> :participants', { participants })
      .andWhere('conversation.participants <@ :participants', { participants })
      .getOne();

    if (existingConversation) {
      return existingConversation;
    }

    const conversation = this.conversationRepository.create({
      participants,
    });

    return this.conversationRepository.save(conversation);
  }

  private messageToDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      content: message.content || undefined,
      senderId: message.senderId,
      receiverId: message.receiverId,
      conversationId: message.conversationId,
      attachments: (message.attachments || []).map((att) => ({
        id: att.id,
        messageId: att.messageId,
        mediaAssetId: att.mediaAssetId,
        type: att.type,
        url: att.url,
        secureUrl: att.secureUrl,
        publicId: att.publicId,
        fileSize: att.fileSize,
        mimeType: att.mimeType,
        originalName: att.originalName,
        metadata: att.metadata,
        createdAt: att.createdAt,
      })),
      readAt: message.readAt ?? undefined,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    };
  }

  private async publishMessageCreatedEvent(
    message: Message,
    attachmentIds?: string[],
  ): Promise<void> {
    const event = {
      eventType: 'message.created',
      data: {
        messageId: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId,
        conversationId: message.conversationId,
        attachmentIds: attachmentIds || [],
        createdAt: message.createdAt,
      },
    };

    await this.kafkaProducer.produce(KAFKA_TOPICS.MESSAGE_CREATED, event);
  }

  private async publishMessageUpdatedEvent(message: Message): Promise<void> {
    const event = {
      eventType: 'message.updated',
      data: {
        messageId: message.id,
        readAt: message.readAt,
        updatedAt: message.updatedAt,
      },
    };

    await this.kafkaProducer.produce(KAFKA_TOPICS.MESSAGE_UPDATED, event);
  }
}
