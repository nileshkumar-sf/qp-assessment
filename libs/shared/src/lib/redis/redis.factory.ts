import {Provider} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import Redis from 'ioredis';
import {REDIS_CLIENT} from './redis.constants';

export const createRedisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const redisClient = new Redis({
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
      password: configService.get<string>('REDIS_PASSWORD'),
      db: configService.get<number>('REDIS_DB'),
    });

    redisClient.on('error', error => {
      console.error('Redis connection error:', error);
    });

    redisClient.on('connect', () => {
      console.log('Successfully connected to Redis');
    });

    return redisClient;
  },
};
