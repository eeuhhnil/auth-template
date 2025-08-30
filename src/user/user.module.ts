import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserController } from './user.contrroller'
import { UserService } from './user.service'
import { Session } from '../session/entities'
import { User } from './entities'
import { StorageModule } from '../storage/storage.module'

@Module({
  imports: [TypeOrmModule.forFeature([User, Session]), StorageModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
