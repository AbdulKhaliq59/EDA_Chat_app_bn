import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:3001';
  }

  async register(email: string, username: string, password: string, firstName?: string, lastName?: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/register`, {
          email,
          username,
          password,
          firstName,
          lastName,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Registration failed',
        error.response?.status || 500,
      );
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/login`, {
          email,
          password,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Login failed',
        error.response?.status || 500,
      );
    }
  }

  async validateToken(token: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.authServiceUrl}/auth/validate`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Token validation failed',
        error.response?.status || 401,
      );
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.authServiceUrl}/auth/refresh`, {
          refreshToken,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data?.message || 'Token refresh failed',
        error.response?.status || 401,
      );
    }
  }

  getGoogleAuthUrl(platform: 'web' | 'mobile'): string {
    const endpoint = platform === 'web' ? 'google' : 'google/mobile';
    return `${this.authServiceUrl}/auth/${endpoint}`;
  }
}
