import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationResolver } from './notification.resolver';
import { NotificationService } from './notification.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [NotificationResolver, NotificationService],
})
export class NotificationModule {}
