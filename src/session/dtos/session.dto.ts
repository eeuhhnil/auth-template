import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, IsDate } from 'class-validator'
import { PaginationDto } from '../../common/dtos'
import { Type } from 'class-transformer'

export class CreateSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  userId: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ip: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceName: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  browser: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  os: string

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Date)
  expiredAt: Date
}

export class UpdateSessionDto extends PartialType(CreateSessionDto) {}
export class QuerySessionDto extends PartialType(PaginationDto) {}
