import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ChatService {
  private readonly chatServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.chatServiceUrl = this.configService.get<string>('CHAT_SERVICE_URL') || 'http://localhost:3002';
  }

  async createMessage(
    senderId: string,
    receiverId: string,
    content: string,
    conversationId?: string,
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.chatServiceUrl}/messages`, {
          senderId,
          receiverId,
          content,
          conversationId,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to create message',
        error.response?.status || 500,
      );
    }
  }

  async getMessages(userId: string, conversationId: string, page = 1, limit = 50) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.chatServiceUrl}/messages/${conversationId}?page=${page}&limit=${limit}&userId=${userId}`,
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch messages',
        error.response?.status || 500,
      );
    }
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.chatServiceUrl}/conversations?userId=${userId}&page=${page}&limit=${limit}`,
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch conversations',
        error.response?.status || 500,
      );
    }
  }

  async markAsRead(messageId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.chatServiceUrl}/messages/${messageId}/read`, {
          userId,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to mark message as read',
        error.response?.status || 500,
      );
    }
  }
}
