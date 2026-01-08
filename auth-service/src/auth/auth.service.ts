import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    HttpException,
    Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private httpService: HttpService,
    ) { }

    async register(email: string, username: string, password: string, firstName?: string, lastName?: string) {
        // Check if email already exists
        const existingUserByEmail = await this.usersService.findByEmail(email);
        if (existingUserByEmail) {
            throw new ConflictException('Email already registered. Please use a different email or login.');
        }

        // Check if username already exists
        const existingUserByUsername = await this.usersService.findByUsername(username);
        if (existingUserByUsername) {
            throw new ConflictException('Username already taken. Please choose a different username.');
        }

        const user = await this.usersService.create(email, username, password);

        const tokens = await this.generateTokens(user.id, user.email, user.username);
        await this.usersService.updateRefreshToken(
            user.id,
            await bcrypt.hash(tokens.refreshToken, 10),
        );

        // Create profile automatically
        try {
            await this.createUserProfile(user.id, firstName, lastName);
        } catch (error) {
            this.logger.warn(`Failed to create profile for user ${user.id}`, error);
            // Don't fail registration if profile creation fails
        }

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                userId: user.id,
                email: user.email,
                username: user.username,
                firstName,
                lastName,
            },
        };
    }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await this.usersService.validatePassword(user, password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.username);
        await this.usersService.updateRefreshToken(
            user.id,
            await bcrypt.hash(tokens.refreshToken, 10),
        );

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                userId: user.id,
                email: user.email,
                username: user.username,
            },
        };
    }

    async refreshToken(refreshToken: string) {
        try {
            const payload = this.jwtService.verify(refreshToken, {
                secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
            });

            const user = await this.usersService.findById(payload.sub);
            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(user.id, user.email, user.username);
            await this.usersService.updateRefreshToken(
                user.id,
                await bcrypt.hash(tokens.refreshToken, 10),
            );

            return {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                user: {
                    userId: user.id,
                    email: user.email,
                    username: user.username,
                },
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async validateToken(userId: string) {
        const user = await this.usersService.findById(userId);
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            userId: user.id,
            email: user.email,
            username: user.username,
        };
    }

    async googleLogin(googleProfile: GoogleProfile) {
        // Extract Google user ID from the profile
        const providerId = (googleProfile as any).googleId || googleProfile.email;

        const user = await this.usersService.createOrUpdateGoogleUser({
            email: googleProfile.email,
            firstName: googleProfile.firstName,
            lastName: googleProfile.lastName,
            picture: googleProfile.picture,
            providerId,
        });

        const tokens = await this.generateTokens(user.id, user.email, user.username);
        await this.usersService.updateRefreshToken(
            user.id,
            await bcrypt.hash(tokens.refreshToken, 10),
        );

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                userId: user.id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                picture: user.picture,
                provider: 'google',
            },
        };
    }

    private async generateTokens(userId: string, email: string, username: string) {
        const payload = { sub: userId, email, username };

        const [accessToken, refreshToken] = await Promise.all([
            // @ts-expect-error - expiresIn accepts string values like '1h', '7d'
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET') || 'dev-secret-key',
                expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '1h',
            }),
            // @ts-expect-error - expiresIn accepts string values like '1h', '7d'
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('REFRESH_TOKEN_SECRET') || 'dev-refresh-secret',
                expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d',
            }),
        ]);

        return { accessToken, refreshToken };
    }

    /**
     * Create a user profile in profile service
     */
    private async createUserProfile(userId: string, firstName?: string, lastName?: string) {
        try {
            const profileServiceUrl = this.configService.get<string>('PROFILE_SERVICE_URL') || 'http://localhost:3004';

            const internalToken = await this.jwtService.signAsync(
                { sub: userId },
                {
                    secret: this.configService.get<string>('JWT_SECRET') || 'dev-secret-key',
                    expiresIn: '5m', // Short-lived token for internal use
                },
            );


            const response = await firstValueFrom(
                this.httpService.post(
                    `${profileServiceUrl}/profiles`,
                    {
                        firstName: firstName || '',
                        lastName: lastName || '',
                        bio: '',
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${internalToken}`,
                        },
                    },
                ),
            );

            this.logger.log(`Profile created successfully for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to create profile for user ${userId}: ${error.message}`);
            if (error.response?.data) {
                this.logger.error(`Profile service response: ${JSON.stringify(error.response.data)}`);
            }
            // Don't throw - profile creation failure shouldn't block user registration
        }
    }
}
