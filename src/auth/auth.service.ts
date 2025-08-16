import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterLocalDto } from './dtos';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Token } from './interfaces';

@Injectable()
export class AuthService {
  private readonly looger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  loginLocal(user: User) {
    return this.generateToken(user.id, user.name, user.email, user.role);
  }

  async generateToken(
    userId: number,
    name: string,
    email: string,
    role: string,
  ) {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          jti: accessJti,
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
          jti: refreshJti,
          sub: userId,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    const accessPayload: any = this.jwt.decode(accessToken);
    const refreshPayload: any = this.jwt.decode(refreshToken);

    const now = Math.floor(Date.now() / 1000);

    const accessTtl = Math.max((accessPayload?.exp ?? 0) - now, 0);
    const refreshTtl = Math.max((refreshPayload?.exp ?? 0) - now, 0);

    await Promise.all([
      this.cacheManager.set(
        `whitelist_accessToken:${accessJti}`,
        true,
        accessTtl * 1000,
      ),
      this.cacheManager.set(
        `whitelist_refreshToken:${refreshJti}`,
        true,
        refreshTtl * 1000,
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async validateToken(token: string) {
    const payload: Token | null = this.jwt.decode(token);

    if (!payload?.sub || !payload?.jti) {
      this.looger.error('Invalid token');
      return false;
    }

    const whitelisted_access = await this.cacheManager.get(
      `whitelist_accessToken:${payload.jti}`,
    );

    if (!whitelisted_access) {
      this.looger.error('Invalid token');
      return false;
    }

    return payload;
  }

  async jwtRefreshToken(refreshToken: string) {
    const payload = this.jwt.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) throw new Error('User not found');

    return this.generateToken(user.id, user.name, user.email, user.role);
  }

  async logout(accessToken: string, refreshToken: string): Promise<void> {
    const accessPayload: any = this.jwt.decode(accessToken);
    const refreshPayload: any = this.jwt.decode(refreshToken);

    if (!accessPayload?.jti || !refreshPayload?.jti) {
      throw new UnauthorizedException('Invalid token payload');
    }
    const results = await Promise.all([
      this.cacheManager.del(`whitelist_accessToken:${accessPayload.jti}`),
      this.cacheManager.del(`whitelist_refreshToken:${refreshPayload.jti}`),
    ]);

    this.looger.log(
      `Logout successful. Deleted access token: ${results[0]}, refresh token: ${results[1]}`,
    );
  }
}
