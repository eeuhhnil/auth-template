import {ConflictException, Injectable, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {User} from "../user/entities/user.entity";
import {Repository} from "typeorm";
import {JwtService} from "@nestjs/jwt";
import {ConfigService} from "@nestjs/config";
import {RegisterLocalDto} from "./dtos";
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwt: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async registerLocal(payload: RegisterLocalDto){
        const existing = await this.userRepository.exists({
            where: {
                email: payload.email
            }
        })

        if(existing){
            throw new ConflictException("Email already exists")
        }

        const user = this.userRepository.create({
            email: payload.email,
            name: payload.name,
            hashPassword: bcrypt.hashSync(payload.password, 10)
        });

        return this.userRepository.save(user);
    }

    async loginLocal(user:any){
        const payload = {sub: user.id, email: user.email}
        return {
            access_token: this.jwt.sign(payload),
            refresh_token: this.jwtSignRefresh(payload)
        }
    }

    async jwtRefreshToken(refreshToken: string){
        const payload = this.jwt.verify(refreshToken, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        })
        const user = await this.userRepository.findOne({
            where: {id:  payload.sub}
        });

        if(!user){
            throw new NotFoundException("User does not exist");
        }

        const authPayload = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name
        }

        return {
            access_token: this.jwt.sign(authPayload),
            refresh_token: this.jwtSignRefresh(authPayload)
        }
    }

    private jwtSignRefresh(payload:  {sub: number, email: string}) {
        return this.jwt.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
    }

}