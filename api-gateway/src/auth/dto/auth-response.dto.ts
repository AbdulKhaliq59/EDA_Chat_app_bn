import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserPayload {
  @Field()
  userId: string;

  @Field()
  email: string;

  @Field()
  username: string;
}

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => UserPayload)
  user: UserPayload;
}
