import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleMobileStrategy extends PassportStrategy(
  Strategy,
  'google-mobile',
) {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_MOBILE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_MOBILE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_MOBILE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const user = {
      email: emails?.[0]?.value || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || '',
      accessToken,
      refreshToken,
      googleId: id,
    };

    done(null, user);
  }
}
