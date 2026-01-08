import { IsEnum, IsOptional } from 'class-validator';

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
}

export class UpdatePresenceDto {
  @IsEnum(PresenceStatus)
  status: PresenceStatus;
}

export class GetPresenceDto {
  @IsOptional()
  userIds?: string[];
}
