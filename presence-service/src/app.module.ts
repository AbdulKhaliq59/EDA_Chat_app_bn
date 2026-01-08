import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Presence } from './entities/presence.entity';
import { PresenceService } from './services/presence.service';
import { PresenceController } from './controllers/presence.controller';
import { RedisService } from './services/redis.service';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'presence_user',
        password: configService.get<string>('DB_PASSWORD') || 'presence_password',
        database: configService.get<string>('DB_NAME') || 'presence_db',
        entities: [Presence],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Presence]),
  ],
  controllers: [AppController, PresenceController],
  providers: [AppService, PresenceService, RedisService, KafkaProducerService, JwtAuthGuard],
})
export class AppModule {}
