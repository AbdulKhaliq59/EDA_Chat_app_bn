import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum OAuthPlatform {
  WEB = 'web',
  MOBILE = 'mobile',
}

@InputType()
export class GoogleAuthInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  code: string;

  @Field(() => String)
  @IsEnum(OAuthPlatform)
  @IsNotEmpty()
  platform: OAuthPlatform;

  @Field({ nullable: true })
  @IsString()
  redirectUri?: string;
}
