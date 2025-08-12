import {ApiProperty} from "@nestjs/swagger";
import {IsEmail, IsEnum, IsNotEmpty, IsString} from "class-validator";
import {UserRole} from "../../user/enums";

export class RegisterLocalDto{
    @ApiProperty({
        example: "user@gmail.com",
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: "linh"
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: "huelinh123"
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({ enum: UserRole, default: UserRole.USER })
    @IsEnum(UserRole)
    role: UserRole
}