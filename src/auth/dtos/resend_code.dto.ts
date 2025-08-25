import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty } from 'class-validator'

export class ResendCodeDto {
  @ApiProperty({
    example: 'k60duongthihuelinh@gmail.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string
}
