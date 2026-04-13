import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class LinkedinStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    super({
      clientID: process.env.LINKEDIN_CLIENT_ID || 'client-id',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'client-secret',
      callbackURL:
        process.env.LINKEDIN_CALLBACK_URL ||
        'http://localhost:3001/auth/linkedin/callback',
      scope: ['openid', 'profile', 'email'],
      userProfileURL: 'https://api.linkedin.com/v2/userinfo',
    } as any);
  }

  userProfile(accessToken: string, done: (err?: any, profile?: any) => void) {
    axios
      .get('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then((response) => {
        const profile = {
          _json: response.data,
        };
        done(null, profile);
      })
      .catch((err) => {
        done(err);
      });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    // OpenID Connect profile comes in _json with different keys
    const json = profile._json || {};
    const user = {
      provider: 'LINKEDIN',
      providerId: json.sub,
      email: json.email,
      firstName: json.given_name,
      lastName: json.family_name,
      fullName: json.name,
      avatar: json.picture,
      accessToken,
    };
    done(null, user);
  }
}
