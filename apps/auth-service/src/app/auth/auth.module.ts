import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {JwtModule} from '@nestjs/jwt';
import {AuthController} from './auth.controller';
import {AuthService} from './auth.service';
import {RedisModule, redisConfig, User} from '@grocery-booking-api/shared';
import {ClientsModule} from '@nestjs/microservices';
import {JwtStrategy} from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {expiresIn: '24h'},
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        ...redisConfig,
      },
      {
        name: 'USER_SERVICE',
        ...redisConfig,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
