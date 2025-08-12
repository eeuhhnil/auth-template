import { Module } from '@nestjs/common';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import {UserModule} from "./user/user.module";
import {AuthModule} from "./auth/auth.module";
import {APP_GUARD} from "@nestjs/core";
import {JwtAuthGuard} from "./auth/guards/jwt-auth.guard";

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
      UserModule,
      AuthModule
  ],
  controllers: [],
  providers: [
      {
          provide: APP_GUARD,
          useClass: JwtAuthGuard,
      }
  ],
})
export class AppModule {}
