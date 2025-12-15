import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Message {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  senderId: string;

  @Field()
  receiverId: string;

  @Field()
  conversationId: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  readAt?: Date;
}

@ObjectType()
export class Conversation {
  @Field(() => ID)
  id: string;

  @Field(() => [String])
  participants: string[];

  @Field({ nullable: true })
  lastMessageAt?: Date;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class PaginatedMessages {
  @Field(() => [Message])
  data: Message[];

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;
}

@ObjectType()
export class PaginatedConversations {
  @Field(() => [Conversation])
  data: Conversation[];

  @Field()
  total: number;

  @Field()
  page: number;

  @Field()
  limit: number;

  @Field()
  totalPages: number;
}
