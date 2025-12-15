import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Notification, PaginatedNotifications } from './dto/notification.dto';

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedNotifications)
  async getNotifications(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @CurrentUser() user: any,
  ): Promise<PaginatedNotifications> {
    return this.notificationService.getNotifications(user.sub, page, limit);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Notification)
  async markNotificationAsRead(
    @Args('notificationId') notificationId: string,
    @CurrentUser() user: any,
  ): Promise<Notification> {
    return this.notificationService.markAsRead(notificationId, user.sub);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean)
  async markAllNotificationsAsRead(@CurrentUser() user: any): Promise<boolean> {
    await this.notificationService.markAllAsRead(user.sub);
    return true;
  }
}
