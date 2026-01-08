import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  Logger,
  Param,
} from '@nestjs/common';
import { PresenceService } from '../services/presence.service';
import { UpdatePresenceDto } from '../dto/presence.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  private readonly logger = new Logger(PresenceController.name);

  constructor(private readonly presenceService: PresenceService) {}

  @Post('update')
  async updatePresence(@Request() req, @Body() updatePresenceDto: UpdatePresenceDto) {
    return this.presenceService.updatePresence(req.user.userId, updatePresenceDto);
  }

  @Get('me')
  async getMyPresence(@Request() req) {
    return this.presenceService.getPresence(req.user.userId);
  }

  @Get('user/:userId')
  async getUserPresence(@Param('userId') userId: string) {
    return this.presenceService.getPresence(userId);
  }

  @Post('bulk')
  async getBulkPresence(@Body() body: { userIds: string[] }) {
    return this.presenceService.getBulkPresence(body.userIds);
  }

  @Post('heartbeat')
  async heartbeat(@Request() req) {
    await this.presenceService.heartbeat(req.user.userId);
    return { success: true };
  }

  @Post('offline')
  async setOffline(@Request() req) {
    return this.presenceService.setOffline(req.user.userId);
  }
}
