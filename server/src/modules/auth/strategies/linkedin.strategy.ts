import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID || 'client-id',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'client-secret',
      callbackURL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:3001/auth/linkedin/callback',
      scope: ['r_emailaddress', 'r_liteprofile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: (err: any, user: any, info?: any) => void): Promise<any> {
    const { id, emails, photos, displayName, name } = profile;
    const user = {
      provider: 'LINKEDIN',
      providerId: id,
      email: emails?.[0]?.value || null,
      firstName: name?.givenName,
      lastName: name?.familyName,
      fullName: displayName,
      avatar: photos?.[0]?.value || null,
      accessToken,
    };
    done(null, user);
  }
}
