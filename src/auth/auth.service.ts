import {
  BadRequestException,
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
import { ClientProxy } from '@nestjs/microservices';
import { OtpCode } from './entities/otp-code.entity';
import { VerifyOtpDto } from './dtos/verify_otp.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly looger = new Logger(AuthService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    @InjectRepository(OtpCode)
    private readonly otpCodeRepository: Repository<OtpCode>,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject('NOTIFICATION_SERVICE')
    private readonly notificationClient: ClientProxy,
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
      isActive: false,
    });

    const savedUser = await this.userRepository.save(user);

    const otp = this.generateOtp();

    await this.otpCodeRepository.save({
      code: otp,
      userId: savedUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    });

    this.notificationClient.emit('user_created', {
      email: payload.email,
      name: payload.name,
      otp,
    });

    return savedUser;
  }

  async login(user: User, req: any) {
    const ip =
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const parser = new UAParser(req.headers['user-agent']);
    const device = `${parser.getOS().name} - ${parser.getBrowser().name}`;

    const refreshJti = uuidv4();

    const session = this.sessionRepository.create({
      user,
      refreshJti,
      ipAddress: ip,
      deviceName: device,
    });

    await this.sessionRepository.save(session);

    const { access_token, refresh_token } = await this.generateToken(
      session.id,
      refreshJti,
      user.id,
      user.email,
      user.name,
      user.role,
    );

    const accessPayload = this.jwt.decode(access_token);
    const refreshPayload = this.jwt.decode(refresh_token);

    session.access_exp = new Date(accessPayload.exp * 1000);
    session.refresh_exp = new Date(refreshPayload.exp * 1000);

    await this.sessionRepository.save(session);

    return { access_token, refresh_token };
  }

  async generateToken(
    accessJti: string,
    refreshJti: string,
    userId: number,
    email: string,
    name: string,
    role: string,
  ) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          jti: accessJti,
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
          jti: refreshJti,
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
      where: { id: payload.jti },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    return payload;
  }

  async logout(token: string) {
    const payload = this.jwt.decode(token);

    const session = await this.sessionRepository.findOne({
      where: { id: payload.jti },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid token');
    }

    await this.sessionRepository.delete(session.id);
  }

  async logoutDevice(userId: number, sessionId: string) {
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

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    const otpCode = await this.otpCodeRepository.findOne({
      where: { code: otp, userId: user.id },
    });

    if (!otpCode) {
      throw new UnauthorizedException('Invalid otp');
    }

    if (otpCode.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    await this.userRepository.update(user.id, { isActive: true });
    await this.otpCodeRepository.delete(otpCode.id);
  }

  async resendCode(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email');
    }

    if (user.isActive) {
      throw new BadRequestException('Account already activated');
    }

    const otp = this.generateOtp();

    await this.otpCodeRepository.delete({ userId: user.id });

    await this.otpCodeRepository.save({
      code: otp,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    });

    this.notificationClient.emit('otp_resend', {
      email: user.email,
      name: user.name,
      otp,
    });
  }
}
