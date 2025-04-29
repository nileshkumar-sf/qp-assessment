import {Module, Logger} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {OrderController} from './order.controller';
import {OrderService} from './order.service';
import {OrderSaga} from './sagas/order.saga';
import {
  Order,
  OrderItem,
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
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Order, OrderItem]),
    ClientsModule.register([
      {
        name: 'INVENTORY_SERVICE',
        ...redisConfig,
      },
      {
        name: 'ORDER_SERVICE',
        ...redisConfig,
      },
    ]),
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderSaga, Logger],
  exports: [OrderService, OrderSaga],
})
export class OrderModule {}
