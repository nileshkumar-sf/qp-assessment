import {RedisOptions, Transport} from '@nestjs/microservices';

export const redisConfig: RedisOptions = {
  transport: Transport.REDIS,
  options: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'],
    retryAttempts: 5,
    retryDelay: 3000,
    db: parseInt(process.env['REDIS_TRANSPORT_DB'] || '1'),
  },
};
