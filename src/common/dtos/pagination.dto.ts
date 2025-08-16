import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    type: Number,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    type: Number,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search term to filter results',
    type: String,
  })
  @IsString({ message: 'Search term must be a string' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Field to sort by, format: fieldName:asc|desc (e.g. createdAt:desc)',
    example: 'createdAt:desc',
    type: String,
  })
  @IsOptional()
  @IsString()
  sort?: string = 'createdAt:desc';
}
