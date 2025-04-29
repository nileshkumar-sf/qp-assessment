import {Inject, Injectable} from '@nestjs/common';
import Redis from 'ioredis';
import {REDIS_CLIENT} from './redis.constants';

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    if (ttl) {
      return this.redisClient.set(key, value, 'EX', ttl);
    }
    return this.redisClient.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }

  async exists(key: string): Promise<number> {
    return this.redisClient.exists(key);
  }

  async setHash(key: string, hash: Record<string, string>): Promise<number> {
    return this.redisClient.hset(key, hash);
  }

  async getHash(key: string): Promise<Record<string, string>> {
    return this.redisClient.hgetall(key);
  }

  async setList(key: string, values: string[]): Promise<number> {
    return this.redisClient.rpush(key, ...values);
  }

  async getList(key: string): Promise<string[]> {
    return this.redisClient.lrange(key, 0, -1);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.redisClient.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.redisClient.ttl(key);
  }
}
