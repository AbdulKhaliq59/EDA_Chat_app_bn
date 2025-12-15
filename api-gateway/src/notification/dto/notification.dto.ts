import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

export enum NotificationType {
  MESSAGE = 'MESSAGE',
  SYSTEM = 'SYSTEM',
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field(() => GraphQLJSON, { nullable: true })
  data?: any;

  @Field()
  read: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedNotifications {
  @Field(() => [Notification])
  data: Notification[];

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;
}
