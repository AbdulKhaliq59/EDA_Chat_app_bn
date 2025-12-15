import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';

export enum PresenceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
}

registerEnumType(PresenceStatus, {
  name: 'PresenceStatus',
});

@InputType()
export class UpdatePresenceInput {
  @Field(() => PresenceStatus)
  @IsEnum(PresenceStatus)
  status: PresenceStatus;
}
