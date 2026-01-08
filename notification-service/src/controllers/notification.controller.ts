import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetNotificationsDto, MarkNotificationReadDto, MarkAllReadDto } from '../dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getNotifications(@Request() req, @Query() getNotificationsDto: GetNotificationsDto) {
    return this.notificationService.getNotifications(req.user.userId, getNotificationsDto);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationService.getUnreadCount(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    return this.notificationService.markAsRead(notificationId, req.user.userId);
  }

  @Post('mark-all-read')
  async markAllAsRead(@Request() req, @Body() markAllReadDto: MarkAllReadDto) {
    await this.notificationService.markAllAsRead(req.user.userId, markAllReadDto.notificationIds);
    return { message: 'Notifications marked as read' };
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') notificationId: string) {
    await this.notificationService.deleteNotification(notificationId, req.user.userId);
    return { message: 'Notification deleted' };
  }
}
