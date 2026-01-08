import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Presence, PresenceStatus } from '../entities/presence.entity';
import { RedisService } from './redis.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { UpdatePresenceDto } from '../dto/presence.dto';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(
    @InjectRepository(Presence)
    private presenceRepository: Repository<Presence>,
    private redisService: RedisService,
    private kafkaProducer: KafkaProducerService,
  ) {}

  async updatePresence(userId: string, updatePresenceDto: UpdatePresenceDto): Promise<any> {
    const { status } = updatePresenceDto;
    const lastSeenAt = new Date();

    // Update or create in PostgreSQL (source of truth)
    let presence = await this.presenceRepository.findOne({ where: { userId } });

    if (presence) {
      presence.status = status;
      presence.lastSeenAt = lastSeenAt;
      presence = await this.presenceRepository.save(presence);
    } else {
      presence = this.presenceRepository.create({
        userId,
        status,
        lastSeenAt,
      });
      presence = await this.presenceRepository.save(presence);
    }

    // Cache in Redis for fast reads
    await this.redisService.setPresence(userId, status, lastSeenAt);

    // Publish event to Kafka
    await this.kafkaProducer.publishPresenceUpdatedEvent(userId, status, lastSeenAt);

    this.logger.log(`User ${userId} presence updated to ${status}`);

    return {
      userId: presence.userId,
      status: presence.status,
      lastSeenAt: presence.lastSeenAt,
    };
  }

  async getPresence(userId: string): Promise<any> {
    // Try Redis first (fast path)
    const cached = await this.redisService.getPresence(userId);
    if (cached) {
      return cached;
    }

    // Fallback to PostgreSQL
    const presence = await this.presenceRepository.findOne({ where: { userId } });

    if (!presence) {
      return {
        userId,
        status: PresenceStatus.OFFLINE,
        lastSeenAt: null,
      };
    }

    // Re-cache for next time
    await this.redisService.setPresence(userId, presence.status, presence.lastSeenAt);

    return {
      userId: presence.userId,
      status: presence.status,
      lastSeenAt: presence.lastSeenAt,
    };
  }

  async getBulkPresence(userIds: string[]): Promise<any[]> {
    // Use Redis bulk get for performance
    return this.redisService.getBulkPresence(userIds);
  }

  async setOffline(userId: string): Promise<any> {
    return this.updatePresence(userId, { status: PresenceStatus.OFFLINE });
  }

  async heartbeat(userId: string): Promise<void> {
    // Extend TTL in Redis for active users
    await this.redisService.extendPresenceTTL(userId);
  }
}
