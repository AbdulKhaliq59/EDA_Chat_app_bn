import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [ChatResolver, ChatService],
})
export class ChatModule {}
