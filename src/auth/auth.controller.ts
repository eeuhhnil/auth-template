import {Body, Controller, Post, Req, UseGuards} from "@nestjs/common";
import {LocalAuthGuard} from "./guards/local-auth.guard";
import {LoginDto, RefreshTokenDto, RegisterLocalDto} from "./dtos";
import {AuthService} from "./auth.service";
import {
    ApiBearerAuth,
    ApiConflictResponse,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse,
    ApiOperation,
    ApiTags
} from "@nestjs/swagger";
import {Public} from "./decorators";

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
export class AuthController {
    constructor(private authService: AuthService) {}

    @ApiOperation({ summary: 'Create User' })
    @ApiCreatedResponse({description: 'User created successfully.'})
    @ApiConflictResponse({description: 'User already exists'})
    @ApiInternalServerErrorResponse({description: 'Internal Server Error'})
    @Public()
    @Post('/register')
    async register(@Body() payload: RegisterLocalDto) {
        return this.authService.registerLocal(payload);
    }

    @ApiOperation({ summary: 'Login local' })
    @ApiOkResponse({description: 'Login local successfully.'})
    @ApiConflictResponse({description: 'Internal Server Error.'})
    @UseGuards(LocalAuthGuard)
    @Public()
    @Post('/login')
    async login(@Body() payload: LoginDto, @Req() req) {
        return this.authService.loginLocal(req.user);
    }

    @ApiOperation({ summary: 'Refresh Token' })
    @ApiOkResponse({description: 'Refresh token successfully.'})
    @ApiNotFoundResponse({description: 'Not Found'})
    @Post('/refresh')
    async refresh(@Body() payload: RefreshTokenDto) {
        return this.authService.jwtRefreshToken(payload.refresh_token)
    }
}