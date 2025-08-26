import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator'

export class ChangePasswordDTO {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  oldPassword: string

  @ApiPropertyOptional({
    type: String,
    example: 'Password@123',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/,
    {
      message:
        'Password must contain at least one uppercase letter, one number, and one special character',
    },
  )
  newPassword: string
}
