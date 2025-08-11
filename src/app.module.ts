import { Module } from '@nestjs/common';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./user/entities/user.entity";
import {UserModule} from "./user/user.module";

@Module({
  imports: [
      ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env'
      }),
      TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
              type: 'postgres',
              url: configService.get<string>('DATABASE_URL'),
              autoLoadEntities: true,
              synchronize: true,
          })
      }),
      UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
