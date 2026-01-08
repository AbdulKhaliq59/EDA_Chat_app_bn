import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';
import { CloudinaryService } from './services/cloudinary.service';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserProfile } from './entities/profile.entity';
import { MediaAsset } from './entities/media-asset.entity';

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
        username: configService.get<string>('DB_USERNAME') || 'profile_user',
        password: configService.get<string>('DB_PASSWORD') || 'profile_password',
        database: configService.get<string>('DB_NAME') || 'profile_db',
        entities: [UserProfile, MediaAsset],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([UserProfile, MediaAsset]),
  ],
  controllers: [ProfileController],
  providers: [ProfileService, CloudinaryService, KafkaProducerService, JwtAuthGuard],
})
export class AppModule {}
