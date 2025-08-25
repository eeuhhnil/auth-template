import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { LoginDto, RefreshTokenDto, RegisterLocalDto } from './dtos'
import { AuthService } from './auth.service'
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { Public } from './decorators'
import { LocalAuthGuard } from './guards/local-auth.guard'
import { VerifyOtpDto } from './dtos/verify_otp.dto'
import { ResendCodeDto } from './dtos/resend_code.dto'

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @Public()
  @ApiOperation({ summary: 'Create User' })
  @ApiCreatedResponse({ description: 'User created successfully.' })
  @ApiConflictResponse({ description: 'User already exists' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async register(@Body() payload: RegisterLocalDto) {
    return this.authService.registerLocal(payload)
  }

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'Login local' })
  @ApiOkResponse({ description: 'Login local successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  @UseGuards(LocalAuthGuard)
  async login(@Body() payload: LoginDto, @Req() req: any) {
    return this.authService.login(req.user, req)
  }

  @Post('refresh')
  @Public()
  @ApiOperation({ summary: 'Refresh token' })
  @ApiOkResponse({ description: 'Refresh token successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token)
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiOkResponse({ description: 'Logout successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async logout(@Req() req) {
    const authHeader = req.headers.authorization
    const accessToken: string | undefined = authHeader?.split(' ')[1]
    if (!accessToken) {
      throw new NotFoundException('No access token found in request')
    }

    await this.authService.logout(accessToken)

    return { message: 'Logout successfully' }
  }

  @Post('logout-device')
  @ApiOperation({ summary: 'Logout-device' })
  @ApiOkResponse({ description: 'Logout successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async logoutDevice(
    @Body('userId') userId: number,
    @Body('sessionId') sessionId: string,
  ) {
    await this.authService.logoutDevice(userId, sessionId)
    return { message: 'Logout successfully' }
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Logout-all' })
  @ApiOkResponse({ description: 'Logout successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async logoutAll(@Body('userId') userId: number) {
    await this.authService.logoutAll(userId)
    return { message: 'Logout successfully' }
  }

  @Post('verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verify otp' })
  @ApiOkResponse({ description: 'Verify otp successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto)
  }

  @Post('resend-code')
  @Public()
  async resendCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.resendCode(resendCodeDto.email)
  }
}
