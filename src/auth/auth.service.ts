import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterLocalDto } from './dtos';
import * as bcrypt from 'bcrypt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UAParser } from 'ua-parser-js';
import { Session } from '../session/entities';
import { Token } from './interfaces';

@Injectable()
export class AuthService {
  private readonly looger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async registerLocal(payload: RegisterLocalDto) {
    const existing = await this.userRepository.exists({
      where: {
        email: payload.email,
      },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const user = this.userRepository.create({
      email: payload.email,
      name: payload.name,
      hashPassword: bcrypt.hashSync(payload.password, 10),
    });

    return this.userRepository.save(user);
  }

  async login(user: User, req: any) {
    const { access_token, refresh_token } = await this.generateToken(
      user.id,
      user.email,
      user.name,
      user.role,
    );

    const accessPayload = this.jwt.decode(access_token);
    const refreshPayload = this.jwt.decode(refresh_token);

    const access_exp = new Date(accessPayload.exp * 1000);
    const refresh_exp = new Date(refreshPayload.exp * 1000);

    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const parser = new UAParser(req.headers['user-agent']);
    const device = `${parser.getOS().name} - ${parser.getBrowser().name}`;

    const session = this.sessionRepository.create({
      user,
      accessToken: access_token,
      refreshToken: refresh_token,
      ipAddress: ip,
      deviceName: device,
      access_exp,
      refresh_exp,
    });

    await this.sessionRepository.save(session);

    return { access_token, refresh_token };
  }

  async generateToken(
    userId: number,
    email: string,
    name: string,
    role: string,
  ) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          email,
          name,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      ),
      this.jwt.signAsync(
        {
          sub: userId,
          email,
          name,
          role,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return { access_token, refresh_token };
  }

  async validateSession(token: string) {
    const payload: Token | null = this.jwt.decode(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }

    const session = await this.sessionRepository.findOne({
      where: { accessToken: token },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    return payload;
  }

  async logout(accessToken: string, refreshToken: string) {
    const session = await this.sessionRepository.findOne({
      where: { accessToken, refreshToken },
    });

    if (!session) {
      this.looger.log('Invalid token');
      throw new UnauthorizedException('Invalid token');
    }

    await this.sessionRepository.delete(session.id);
  }

  async logoutDevice(userId: number, sessionId: number) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.sessionRepository.delete(session.id);
  }

  async logoutAll(userId: number) {
    await this.sessionRepository.delete({ userId });
  }
}
