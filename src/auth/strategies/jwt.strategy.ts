import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET')!;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (!token) throw new UnauthorizedException('No token provided');

    if (!payload.sub || !payload.jti) {
      this.logger.error('Invalid token payload');
      throw new UnauthorizedException('Invalid token payload');
    }

    const isValid = await this.authService.validateToken(token);
    if (!isValid) {
      this.logger.error(`Token for user ${payload.sub} is invalid`);
      throw new UnauthorizedException('Token is invalid or has been revoked');
    }

    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
