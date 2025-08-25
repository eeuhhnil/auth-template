import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from './entities'
import { SessionController } from './session.controller'
import { SessionService } from './session.service'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [ScheduleModule.forRoot(), TypeOrmModule.forFeature([Session])],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
