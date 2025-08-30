import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger'
import { UserService } from './user.service'
import { QueryUserDto, UpdateMeDto, UpdateUserDto } from './dtos'
import { AuthUser } from '../auth/decorators/auth-user.decorator'
import type { AuthPayload } from '../auth/types'
import { UserRole } from './enums'
import { FileInterceptor } from '@nestjs/platform-express'
import { Roles } from 'src/auth/decorators'

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
    return this.userService.findMany(query)
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
        removeAvatar: {
          type: 'boolean',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (req, file, callback) => {
        if (
          !file.mimetype.startsWith('image/') ||
          file.mimetype === 'image/gif'
        ) {
          return callback(
            new BadRequestException('Only images accepted'),
            false,
          )
        }
        callback(null, true)
      },
    }),
  )
  @Patch('me')
  async updateMe(
    @AuthUser() authPayload: AuthPayload,
    @Body() payload: UpdateMeDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.userService.updateMe(authPayload, payload, file)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ description: 'Get user by id successfully.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async findOneById(@Param('id') id: number) {
    return this.userService.findOneById(id)
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update User by id' })
  @ApiOkResponse({ description: 'Update User by id successfully.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async updateById(@Param('id') id: number, @Body() payload: UpdateUserDto) {
    return this.userService.updateById(id, payload)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete User by id' })
  @ApiOkResponse({ description: 'Delete User by id successfully.' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  async deleteById(@Param('id') id: number) {
    return this.userService.deleteById(id)
  }
}
