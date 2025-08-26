import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ChangePasswordDTO, RegisterLocalDto } from './dtos'
import * as bcrypt from 'bcrypt'
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager'
import { UAParser } from 'ua-parser-js'
import { Session } from '../session/entities'
import { ClientProxy } from '@nestjs/microservices'
import { OtpCode } from './entities/otp-code.entity'
import { VerifyOtpDto } from './dtos/verify_otp.dto'
import { User } from '../user/entities'

@Injectable()
export class AuthService {
  private readonly looger = new Logger(AuthService.name)
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
    })

    if (existing) {
      throw new ConflictException('Email already exists')
    }

    const user = this.userRepository.create({
      email: payload.email,
      name: payload.name,
      hashPassword: bcrypt.hashSync(payload.password, 10),
      isActive: false,
    })

    const savedUser = await this.userRepository.save(user)

    const otp = this.generateOtp()

    await this.otpCodeRepository.save({
      code: otp,
      userId: savedUser.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    })

    this.notificationClient.emit('user_created', {
      email: payload.email,
      name: payload.name,
      otp,
    })

    return savedUser
  }

  async login(user: User, req: any) {
    const clientInfo = this.getLoginInfo(req)
    const refresh_expires =
      this.configService.get<string>('JWT_REFRESH_EXPIRES') || '7d'
    const session = this.sessionRepository.create({
      user,
      ip: clientInfo.ip,
      deviceName: clientInfo.device,
      browser: clientInfo.browser,
      os: clientInfo.os,
      expiredAt: this.getExpirationDate(refresh_expires),
    })

    await this.sessionRepository.save(session)

    const { access_token, refresh_token } = await this.generateToken(
      user,
      session,
    )

    return { access_token, refresh_token }
  }

  async generateToken(user: User, session: Session) {
    const [access_token, refresh_token] = await Promise.all([
      this.jwt.signAsync(
        {
          jti: session.id,
          sub: user.id,
          name: user.name,
          role: user.role,
        },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      ),
      this.jwt.signAsync(
        {
          sub: user.id,
          jti: session.id,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ])

    return { access_token, refresh_token }
  }

  async refreshToken(refreshToken: string) {
    const payload = this.jwt.verify(refreshToken, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    })

    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    })

    const session = await this.sessionRepository.findOne({
      where: { id: payload.jti },
    })

    if (!user || !session) throw new UnauthorizedException()

    const refreshExp = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
      '7d',
    )
    const newExpiredAt = this.getExpirationDate(refreshExp)

    await this.sessionRepository.update(session.id, {
      expiredAt: newExpiredAt,
    })

    const { access_token, refresh_token } = await this.generateToken(
      user,
      session,
    )
    return { access_token, refresh_token }
  }

  async logout(token: string) {
    const payload = this.jwt.decode(token)

    const session = await this.sessionRepository.findOne({
      where: { id: payload.jti },
    })

    if (!session) {
      throw new UnauthorizedException('Invalid token')
    }

    await this.sessionRepository.delete(session.id)
  }

  async logoutDevice(userId: number, sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, user: { id: userId } },
    })

    if (!session) throw new UnauthorizedException('Invalid token')

    await this.sessionRepository.delete(session.id)
  }

  async logoutAll(userId: number) {
    await this.sessionRepository.delete({ userId })
  }

  private generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto
    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email')
    }

    const otpCode = await this.otpCodeRepository.findOne({
      where: { code: otp, userId: user.id },
    })

    if (!otpCode) {
      throw new UnauthorizedException('Invalid otp')
    }

    if (otpCode.expiresAt < new Date()) {
      throw new UnauthorizedException('OTP expired')
    }

    await this.userRepository.update(user.id, { isActive: true })
    await this.otpCodeRepository.delete(otpCode.id)
  }

  async resendCode(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email')
    }

    if (user.isActive) {
      throw new BadRequestException('Account already activated')
    }

    const otp = this.generateOtp()

    await this.otpCodeRepository.delete({ userId: user.id })

    await this.otpCodeRepository.save({
      code: otp,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 5),
    })

    this.notificationClient.emit('otp_resend', {
      email: user.email,
      name: user.name,
      otp,
    })
  }

  private getLoginInfo(req: any) {
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      ''

    const userAgent = req.headers['user-agent'] || ''
    const parser = new UAParser(userAgent)
    const result = parser.getResult()

    return {
      ip,
      browser: result.browser.name || 'Unknown',
      browserVersion: result.browser.version || 'Unknown',
      os: result.os.name || 'Unknown',
      osVersion: result.os.version || 'Unknown',
      device: result.device.model || 'Desktop',
      // userAgent,
    }
  }

  private parseExpiration(exp: string): number {
    const regex = /^(\d+)([dhms])$/i
    const match = exp.match(regex)
    if (!match) {
      throw new Error(`Invalid expiration format: ${exp}`)
    }

    const value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000 // ngày
      case 'h':
        return value * 60 * 60 * 1000 // giờ
      case 'm':
        return value * 60 * 1000 // phút
      case 's':
        return value * 1000 // giây
      default:
        throw new Error(`Unsupported unit: ${unit}`)
    }
  }

  private getExpirationDate(exp: string): Date {
    return new Date(Date.now() + this.parseExpiration(exp))
  }

  async changePassword(userId: number, payload: ChangePasswordDTO) {
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) throw new NotFoundException('Invalid user id')

    const isMatch = bcrypt.compareSync(payload.oldPassword, user.hashPassword)
    if (!isMatch) throw new UnauthorizedException('Invalid password')

    user.hashPassword = bcrypt.hashSync(payload.newPassword, 10)

    await this.userRepository.save(user)
  }
}
