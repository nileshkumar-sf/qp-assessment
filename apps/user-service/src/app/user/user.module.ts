import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {
  User,
  Order,
  RedisModule,
  redisConfig,
} from '@grocery-booking-api/shared';
import {ClientsModule} from '@nestjs/microservices';

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
        entities: ['dist/libs/shared/src/lib/entities/**/*.entity{.ts,.js}'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Order]),
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        ...redisConfig,
      },
      {
        name: 'INVENTORY_SERVICE',
        ...redisConfig,
      },
    ]),
    RedisModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
