import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { QueryUserDto, UpdateUserDto } from './dtos/user.dto';
import { Public } from '../auth/decorators';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponse({ description: 'Get all users successfully.' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async findMany(@Query() query: QueryUserDto) {
    return this.userService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ description: 'Get user by id successfully.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async findOneById(@Param('id') id: number) {
    return this.userService.findOneById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update User by id' })
  @ApiOkResponse({ description: 'Update User by id successfully.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async updateById(@Param('id') id: number, @Body() payload: UpdateUserDto) {
    return this.userService.updateById(id, payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete User by id' })
  @ApiOkResponse({ description: 'Delete User by id successfully.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async deleteById(@Param('id') id: number) {
    return this.userService.deleteById(id);
  }
}
