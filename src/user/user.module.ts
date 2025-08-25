import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './user.contrroller'
import { UserService } from './user.service'
import { Session } from '../session/entities'
import { User } from './entities'

@Module({
  imports: [TypeOrmModule.forFeature([User, Session])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
