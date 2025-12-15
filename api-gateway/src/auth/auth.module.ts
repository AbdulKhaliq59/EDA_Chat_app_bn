import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';

@Module({
    imports: [
        HttpModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService): JwtModuleOptions => ({
                secret: configService.get<string>('JWT_SECRET') || 'dev-secret-key',
                signOptions: {
                    // @ts-expect-error - expiresIn accepts string values like '1h', '7d'
                    expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h',
                },
            }),
        }),
    ],
    providers: [AuthResolver, AuthService],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
