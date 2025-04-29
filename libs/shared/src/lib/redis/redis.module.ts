import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {createRedisProvider} from './redis.factory';
import {RedisService} from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [createRedisProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
