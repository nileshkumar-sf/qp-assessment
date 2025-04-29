/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import {NestFactory} from '@nestjs/core';
import {ConfigService} from '@nestjs/config';
import {AppModule} from './app/app.module';
import {Logger} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const globalPrefix = configService.get<string>('api.globalPrefix');
  app.setGlobalPrefix(globalPrefix);

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Grocery Booking API')
    .setDescription('API documentation for Grocery Booking System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('api.port');
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(
    `📚 Swagger documentation is available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
