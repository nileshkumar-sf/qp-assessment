export default () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_CACHE_TTL || '3600', 10),
    // Redis transport configuration
    transport: {
      host: process.env.REDIS_TRANSPORT_HOST || 'localhost',
      port: parseInt(process.env.REDIS_TRANSPORT_PORT || '6379', 10),
      password: process.env.REDIS_TRANSPORT_PASSWORD,
      db: parseInt(process.env.REDIS_TRANSPORT_DB || '0', 10),
      retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '5', 10),
      retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    },
    queues: {
      auth: process.env.AUTH_QUEUE || 'auth_queue',
      admin: process.env.ADMIN_QUEUE || 'admin_queue',
      user: process.env.USER_QUEUE || 'user_queue',
      order: process.env.ORDER_QUEUE || 'order_queue',
      inventory: process.env.INVENTORY_QUEUE || 'inventory_queue',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    globalPrefix: process.env.API_GLOBAL_PREFIX || 'api',
  },
});
