import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { MessageAttachment } from './entities/message-attachment.entity';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CloudinaryService } from './services/cloudinary.service';


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
        username: configService.get<string>('DB_USERNAME') || 'chat_user',
        password: configService.get<string>('DB_PASSWORD') || 'chat_password',
        database: configService.get<string>('DB_NAME') || 'chat_db',
        entities: [Message, Conversation, MessageAttachment],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([Message, Conversation, MessageAttachment]),
  ],
  controllers: [AppController, ChatController],
  providers: [AppService, ChatService, KafkaProducerService, JwtAuthGuard, CloudinaryService],
})
export class AppModule { }
