import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Res,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.username,
      registerDto.password,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('validate')
  async validate(@Request() req) {
    return this.authService.validateToken(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }

  // Google OAuth - Web
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.WEB_APP_URL}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    return res.redirect(redirectUrl);
  }

  // Google OAuth - Mobile
  @Get('google/mobile')
  @UseGuards(AuthGuard('google-mobile'))
  async googleAuthMobile() {
    // Initiates Google OAuth flow for mobile
  }

  @Get('google/mobile/callback')
  @UseGuards(AuthGuard('google-mobile'))
  async googleAuthMobileCallback(@Request() req, @Res() res: Response) {
    const result = await this.authService.googleLogin(req.user);
    
    // Deep link redirect for mobile apps
    const deepLink = `${process.env.MOBILE_APP_SCHEME}://auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    return res.redirect(deepLink);
  }
}
