import { PassportStrategy } from '@nestjs/passport'
import { Strategy, VerifyCallback } from 'passport-google-oauth20'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth.service'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: config.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    })
  }

  async validate(req: any, profile: any, done: VerifyCallback): Promise<any> {
    try {
      const { id, displayName, emails, photos } = profile

      const user = await this.auth.validateGoogleUser(
        {
          googleId: id,
          email: emails?.[0]?.value ?? null,
          name: displayName,
          avatar: photos?.[0]?.value ?? null,
        },
        req,
      )

      done(null, user)
    } catch (err) {
      done(err, false)
    }
  }
}
