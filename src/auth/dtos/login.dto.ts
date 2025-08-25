import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({
    example: 'k60duongthihuelinh@gmail.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string

  @ApiProperty({
    example: 'huelinh123',
  })
  @IsNotEmpty()
  @IsString()
  password: string
}
