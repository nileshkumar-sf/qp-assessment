import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {AdminController} from './admin.controller';
import {AdminService} from './admin.service';
import {GroceryItem} from '@grocery-booking-api/shared';
import {ClientsModule, Transport} from '@nestjs/microservices';
import {RedisModule} from '@grocery-booking-api/shared';

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
    TypeOrmModule.forFeature([GroceryItem]),
    ClientsModule.register([
      {
        name: 'ADMIN_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      },
      {
        name: 'INVENTORY_SERVICE',
        transport: Transport.REDIS,
        options: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        },
      },
    ]),
    RedisModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
