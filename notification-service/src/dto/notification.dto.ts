import { IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class GetNotificationsDto {
  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;
}

export class MarkNotificationReadDto {
  @IsUUID()
  notificationId: string;
}

export class MarkAllReadDto {
  @IsUUID('4', { each: true })
  @IsOptional()
  notificationIds?: string[];
}
