import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { GqlAuthGuard } from '../common/guards/gql-auth.guard';
import { ProfileType } from './dto/profile.dto';
import { JwtService } from '@nestjs/jwt';

@Resolver()
export class ProfileResolver {
    constructor(
        private readonly profileService: ProfileService,
        private readonly jwtService: JwtService,
    ) { }

    @UseGuards(GqlAuthGuard)
    @Query(() => ProfileType)
    async getMyProfile(@Context() context: any): Promise<any> {
        const token = this.extractTokenFromHeader(context.req);
        const payload = this.jwtService.decode(token) as any;
        const userId = payload.sub;
        return this.profileService.getProfileByUserId(userId);
    }

    @Query(() => ProfileType)
    async getProfile(@Args('userId', { nullable: true }) userId?: string, @Context() context?: any): Promise<any> {
        // If userId not provided, extract from token
        if (!userId) {
            try {
                const token = this.extractTokenFromHeader(context.req);
                const payload = this.jwtService.decode(token) as any;
                userId = payload.sub;
            } catch (error) {
                throw new Error('userId required or provide valid access token');
            }
        }
        return this.profileService.getProfileByUserId(userId!);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => ProfileType)
    async updateProfile(
        @Args('firstName', { nullable: true }) firstName?: string,
        @Args('lastName', { nullable: true }) lastName?: string,
        @Args('bio', { nullable: true }) bio?: string,
        @Args('location', { nullable: true }) location?: string,
        @Args('website', { nullable: true }) website?: string,
        @Context() context?: any,
    ): Promise<any> {
        const token = this.extractTokenFromHeader(context.req);
        const updateData = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(bio && { bio }),
            ...(location && { location }),
            ...(website && { website }),
        };
        return this.profileService.updateProfile(token, updateData);
    }

    @UseGuards(GqlAuthGuard)
    @Mutation(() => ProfileType)
    async deleteProfilePicture(@Context() context: any): Promise<any> {
        const token = this.extractTokenFromHeader(context.req);
        return this.profileService.deleteProfilePicture(token);
    }

    /**
     * Extract JWT token from Authorization header
     */
    private extractTokenFromHeader(request: any): string {
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            throw new Error('No authorization header provided');
        }
        const [type, token] = authHeader.split(' ');
        if (type !== 'Bearer') {
            throw new Error('Invalid authorization header format');
        }
        return token;
    }
}
