import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  private readonly notificationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.notificationServiceUrl = this.configService.get<string>('NOTIFICATION_SERVICE_URL') || 'http://localhost:3004';
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.notificationServiceUrl}/notifications?userId=${userId}&page=${page}&limit=${limit}`,
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch notifications',
        error.response?.status || 500,
      );
    }
  }

  async markAsRead(notificationId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(
          `${this.notificationServiceUrl}/notifications/${notificationId}/read`,
          { userId },
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to mark notification as read',
        error.response?.status || 500,
      );
    }
  }

  async markAllAsRead(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.patch(`${this.notificationServiceUrl}/notifications/read-all`, {
          userId,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to mark all notifications as read',
        error.response?.status || 500,
      );
    }
  }
}
