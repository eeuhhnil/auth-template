import { Controller, Post } from '@nestjs/common';
import { SessionService } from './session.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller('session')
@ApiTags('Session')
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse({ description: 'Get all sessions successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post('get-all')
  async findManySessions() {
    return await this.sessionService.findManySession();
  }
}
