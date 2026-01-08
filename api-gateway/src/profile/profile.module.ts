import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}
