import {
  Body,
  Controller,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RefreshTokenDto, RegisterLocalDto } from './dtos';
import { AuthService } from './auth.service';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from './decorators';
import { LocalAuthGuard } from './guards/local-auth.guard';

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
    return this.authService.registerLocal(payload);
  }

  @Post('/login')
  @Public()
  @ApiOperation({ summary: 'Login local' })
  @ApiOkResponse({ description: 'Login local successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  @UseGuards(LocalAuthGuard)
  @UseGuards(LocalAuthGuard)
  async login(@Req() req: any) {
    return this.authService.login(req.user, req);
  }

  @Post('/logout')
  @ApiOperation({ summary: 'Logout' })
  @ApiOkResponse({ description: 'Logout successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async logout(@Req() req, @Body() refresh_token: RefreshTokenDto) {
    const authHeader = req.headers.authorization;
    const accessToken: string | undefined = authHeader?.split(' ')[1];
    if (!accessToken) {
      throw new NotFoundException('No access token found in request');
    }

    await this.authService.logout(accessToken, refresh_token.refresh_token);

    return { message: 'Logout successfully' };
  }

  @Post('logout-device')
  @ApiOperation({ summary: 'Logout-device' })
  @ApiOkResponse({ description: 'Logout successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async logoutDevice(
    @Body('userId') userId: number,
    @Body('sessionId') sessionId: number,
  ) {
    await this.authService.logoutDevice(userId, sessionId);
    return { message: 'Logout successfully' };
  }

  @Post('logout-all')
  @ApiOperation({ summary: 'Logout-all' })
  @ApiOkResponse({ description: 'Logout successfully.' })
  @ApiConflictResponse({ description: 'Internal Server Error.' })
  async logoutAll(@Body('userId') userId: number) {
    await this.authService.logoutAll(userId);
    return { message: 'Logout successfully' };
  }
}
