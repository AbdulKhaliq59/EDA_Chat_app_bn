import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Request,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from '../services/chat.service';
import { CreateMessageDto, GetMessagesDto } from '../dto/message.dto';
import { CreateConversationDto } from '../dto/conversation.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AttachmentType } from '../entities/message-attachment.entity';
import { memoryStorage } from 'multer';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async createMessage(@Request() req, @Body() createMessageDto: CreateMessageDto) {
    return this.chatService.createMessage(req.user.sub || req.user.userId, createMessageDto);
  }

  @Get('messages')
  async getMessages(@Request() req, @Query() getMessagesDto: GetMessagesDto) {
    return this.chatService.getMessages(getMessagesDto, req.user.sub || req.user.userId);
  }

  @Patch('messages/:id/read')
  async markMessageAsRead(@Request() req, @Param('id') messageId: string) {
    return this.chatService.markMessageAsRead(messageId, req.user.sub || req.user.userId);
  }

  @Get('conversations')
  async getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.sub || req.user.userId);
  }

  @Post('conversations')
  async createConversation(@Request() req, @Body() createConversationDto: CreateConversationDto) {
    // Ensure the current user is included in participants
    const userId = req.user.sub || req.user.userId;
    const participants = Array.from(new Set([userId, ...createConversationDto.participants]));
    return this.chatService.createConversation(participants);
  }

  /**
   * Upload message attachment (image, video, audio, document, voice message)
   * POST /chat/attachments
   */
  @Post('attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
      },
    }),
  )
  async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Query('type') attachmentType: string,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!attachmentType || !Object.values(AttachmentType).includes(attachmentType as AttachmentType)) {
      throw new BadRequestException(
        `Invalid attachment type. Must be one of: ${Object.values(AttachmentType).join(', ')}`,
      );
    }

    return this.chatService.uploadAttachment(
      file,
      attachmentType as AttachmentType,
      req.user.sub || req.user.userId,
    );
  }
}
