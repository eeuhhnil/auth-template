import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator'
import { PaginationDto } from '../../common/dtos'
import { UserRole } from '../enums'

export class CreateUserDto {
  @ApiProperty({
    example: 'user@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string

  @ApiProperty({
    example: 'linh',
  })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({
    example: 'huelinh123',
  })
  @IsString()
  @IsNotEmpty()
  password: string
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole
}

export class UpdateMeDto {
  @ApiPropertyOptional({
    example: 'linh',
  })
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  removeAvatar?: boolean
}

export class QueryUserDto extends PartialType(PaginationDto) {}
