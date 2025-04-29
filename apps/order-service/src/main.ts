/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {NestFactory} from '@nestjs/core';
import {Transport} from '@nestjs/microservices';
import {OrderModule} from './app/order/order.module';
import {Logger} from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(OrderModule, {
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      retryAttempts: 5,
      retryDelay: 3000,
    },
  });

  await app.listen();
  Logger.log('Order Microservice is listening');
}

bootstrap();
