import { Resolver, Mutation, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateMessageInput } from './dto/create-message.input';
import { Message, PaginatedMessages, PaginatedConversations } from './dto/message.dto';

@Resolver()
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async sendMessage(
    @Args('input') input: CreateMessageInput,
    @CurrentUser() user: any,
  ): Promise<Message> {
    return this.chatService.createMessage(
      user.sub,
      input.receiverId,
      input.content,
      input.conversationId,
    );
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedMessages)
  async getMessages(
    @Args('conversationId') conversationId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 50 }) limit: number,
    @CurrentUser() user: any,
  ): Promise<PaginatedMessages> {
    return this.chatService.getMessages(user.sub, conversationId, page, limit);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => PaginatedConversations)
  async getConversations(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit: number,
    @CurrentUser() user: any,
  ): Promise<PaginatedConversations> {
    return this.chatService.getConversations(user.sub, page, limit);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  async markMessageAsRead(
    @Args('messageId') messageId: string,
    @CurrentUser() user: any,
  ): Promise<Message> {
    return this.chatService.markAsRead(messageId, user.sub);
  }
}
