import { Resolver, Mutation, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PresenceService } from './presence.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdatePresenceInput } from './dto/update-presence.input';
import { Presence } from './dto/presence.dto';

@Resolver()
export class PresenceResolver {
  constructor(private readonly presenceService: PresenceService) {}

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Presence)
  async updatePresence(
    @Args('input') input: UpdatePresenceInput,
    @CurrentUser() user: any,
  ): Promise<Presence> {
    return this.presenceService.updatePresence(user.sub, input.status);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Presence)
  async getPresence(@Args('userId') userId: string): Promise<Presence> {
    return this.presenceService.getPresence(userId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Presence])
  async getMultiplePresence(
    @Args('userIds', { type: () => [String] }) userIds: string[],
  ): Promise<Presence[]> {
    return this.presenceService.getMultiplePresence(userIds);
  }
}
