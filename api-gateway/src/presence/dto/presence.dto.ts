import { ObjectType, Field } from '@nestjs/graphql';
import { PresenceStatus } from './update-presence.input';

@ObjectType()
export class Presence {
  @Field()
  userId: string;

  @Field(() => PresenceStatus)
  status: PresenceStatus;

  @Field()
  lastSeenAt: Date;
}
