import { Module, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import configuration from '../config/configuration';
import { ClientStrategyFactory } from '@grocery-booking-api/shared';
import { AuthClientStrategy } from '@grocery-booking-api/shared';
import { AdminClientStrategy } from '@grocery-booking-api/shared';
import { UserClientStrategy } from '@grocery-booking-api/shared';
import { OrderClientStrategy } from '@grocery-booking-api/shared';
import { InventoryClientStrategy } from '@grocery-booking-api/shared';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
      {
        name: 'USER_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
      {
        name: 'ORDER_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    ClientStrategyFactory,
    AuthClientStrategy,
    AdminClientStrategy,
    UserClientStrategy,
    OrderClientStrategy,
    InventoryClientStrategy,
  ],
})
export class AppModule { }
