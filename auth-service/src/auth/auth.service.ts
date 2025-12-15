import {
    Injectable,
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(email: string, username: string, password: string) {
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        const user = await this.usersService.create(email, username, password);

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
}
