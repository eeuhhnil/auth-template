import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class RefreshTokenDto {
  @ApiProperty({
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string
}
