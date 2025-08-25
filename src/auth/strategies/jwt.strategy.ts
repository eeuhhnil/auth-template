import { ExtractJwt, Strategy } from 'passport-jwt'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { AuthService } from '../auth.service'
import { SessionService } from '../../session/session.service'
import { AuthPayload } from '../types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name)
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {
    const secret = configService.get<string>('JWT_SECRET')!
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    })
  }

  async validate(request: Request, payload: AuthPayload) {
    console.log('Decoded JWT payload:', payload)
    if (!payload?.jti || !payload?.sub)
      throw new UnauthorizedException('Invalid JWT payload')

    const session = await this.sessionService.findById(payload.jti)
    if (!session) throw new UnauthorizedException('Session expired or revoked')

    return payload
  }
}
