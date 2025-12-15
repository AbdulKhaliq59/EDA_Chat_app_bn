import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PresenceResolver } from './presence.resolver';
import { PresenceService } from './presence.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [PresenceResolver, PresenceService],
})
export class PresenceModule {}
