import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export enum OAuthPlatform {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(OAuthPlatform)
  @IsNotEmpty()
  platform: OAuthPlatform;

  @IsString()
  @IsOptional()
  redirectUri?: string;
}
