import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PresenceService {
  private readonly presenceServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.presenceServiceUrl = this.configService.get<string>('PRESENCE_SERVICE_URL') || 'http://localhost:3003';
  }

  async updatePresence(userId: string, status: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.presenceServiceUrl}/presence`, {
          userId,
          status,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to update presence',
        error.response?.status || 500,
      );
    }
  }

  async getPresence(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.presenceServiceUrl}/presence/${userId}`),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch presence',
        error.response?.status || 500,
      );
    }
  }

  async getMultiplePresence(userIds: string[]) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.presenceServiceUrl}/presence/bulk`, {
          userIds,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Failed to fetch presence',
        error.response?.status || 500,
      );
    }
  }
}
