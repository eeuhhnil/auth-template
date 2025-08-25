import { Controller, Get, Param, Query } from '@nestjs/common'
import { SessionService } from './session.service'
import {
  ApiBearerAuth,
  ApiTags,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger'
import { QuerySessionDto } from './dtos'

@Controller('session')
@ApiTags('Session')
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @ApiOperation({ summary: 'Get all sessions' })
  @ApiOkResponse({ description: 'Get all sessions successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get('get-all')
  async findManySessions(@Query() query: QuerySessionDto) {
    return await this.sessionService.findManySession(query)
  }

  @ApiOperation({ summary: 'Get session by id' })
  @ApiOkResponse({ description: 'Get session by id successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    return await this.sessionService.findById(id)
  }
}
