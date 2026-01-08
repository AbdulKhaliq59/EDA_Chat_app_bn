import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private readonly TTL = 300; // 5 minutes

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Redis({
        host: this.configService.get<string>('REDIS_HOST') || 'localhost',
        port: this.configService.get<number>('REDIS_PORT') || 6379,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });

      this.client.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.logger.error('❌ Redis connection error:', error);
      });

      await this.client.ping();
    } catch (error) {
      this.logger.error('Failed to initialize Redis', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Failed to close Redis connection', error);
    }
  }

  async setPresence(userId: string, status: string, lastSeenAt: Date): Promise<void> {
    const key = `presence:${userId}`;
    const value = JSON.stringify({
      userId,
      status,
      lastSeenAt: lastSeenAt.toISOString(),
    });

    await this.client.setex(key, this.TTL, value);
  }

  async getPresence(userId: string): Promise<any | null> {
    const key = `presence:${userId}`;
    const value = await this.client.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async getBulkPresence(userIds: string[]): Promise<any[]> {
    const pipeline = this.client.pipeline();

    userIds.forEach((userId) => {
      const key = `presence:${userId}`;
      pipeline.get(key);
    });

    const results = await pipeline.exec();

    if (!results) {
      return userIds.map((userId) => ({
        userId,
        status: 'OFFLINE',
        lastSeenAt: null,
      }));
    }

    return results.map((result, index) => {
      if (result[1]) {
        return JSON.parse(result[1] as string);
      }
      return {
        userId: userIds[index],
        status: 'OFFLINE',
        lastSeenAt: null,
      };
    });
  }

  async deletePresence(userId: string): Promise<void> {
    const key = `presence:${userId}`;
    await this.client.del(key);
  }

  async extendPresenceTTL(userId: string): Promise<void> {
    const key = `presence:${userId}`;
    await this.client.expire(key, this.TTL);
  }
}
