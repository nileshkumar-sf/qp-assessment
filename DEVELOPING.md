# Development Guide

## Prerequisites

- Node.js (v16 or later)
- Docker and Docker Compose
- npm or yarn
- PostgreSQL
- Redis

## Local Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd grocery-booking-api
```

2. Install dependencies:

```bash
npm install
```

3. Create environment files:

```bash
cp .env.example .env
```

4. Start the services:

```bash
docker-compose up -d
```

## Development Commands

- Start all services in development mode:

```bash
npm run start:dev
```

- Run tests:

```bash
npm run test
```

## Service Configuration

### Environment Variables

Make sure to set up the following environment variables in your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
AUTH_DB_PASSWORD=
ADMIN_DB_PASSWORD=
USER_DB_PASSWORD=
ORDER_DB_PASSWORD=
INVENTORY_DB_PASSWORD=

# JWT Configuration
JWT_SECRET=
JWT_EXPIRATION=

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TRANSPORT_DB=1
REDIS_CACHE_DB=0
REDIS_RETRY_ATTEMPTS=5
REDIS_RETRY_DELAY=3000

# Service Configuration
API_PORT=3000
NODE_ENV=development
```

### Service Ports

- API Gateway: 3000
- Auth Service: 3001
- Admin Service: 3002
- User Service: 3003
- Order Service: 3004
- Inventory Service: 3005
- Redis: 6379
- PostgreSQL: 5432

## API Documentation

Once the services are running, you can access the Swagger documentation at:

- API Gateway: http://localhost:3000/api
- Auth Service: http://localhost:3001/api
- Admin Service: http://localhost:3002/api
- User Service: http://localhost:3003/api
- Order Service: http://localhost:3004/api
- Inventory Service: http://localhost:3005/api

## Monitoring and Observability

### Health Checks

- Each service exposes a `/health` endpoint
- Database connection monitoring
- Redis connection status
- Cache availability

### Logging

- Centralized logging system
- Log aggregation
- Error tracking and alerting

### Metrics

- Service metrics collection
- Performance monitoring
- Resource utilization tracking

## Redis Configuration

### Redis Architecture

Redis serves multiple purposes in our architecture:

1. **Message Transport (DB 1)**

   - Handles inter-service communication using Redis pub/sub
   - Each service has dedicated channels
   - Supports retry mechanisms for reliability
   - Message persistence for critical operations

2. **Caching Layer (DB 0)**
   - Provides fast data access
   - Session management
   - Idempotency keys
   - Frequently accessed data

### Message Channels

1. **Order Service Channels**

   - `order:events` - Order lifecycle events
   - `order:saga:events` - Saga coordination events
   - `order:notifications` - Order status notifications

2. **Inventory Service Channels**
   - `inventory:check` - Inventory availability checks
   - `inventory:reserve` - Inventory reservation requests
   - `inventory:release` - Inventory release notifications

### Message Formats

#### Order Events

```typescript
interface OrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_COMPLETED' | 'ORDER_FAILED';
  payload: {
    orderId: string;
    userId: string;
    status: OrderStatus;
    items: OrderItem[];
  };
}
```

#### Inventory Events

```typescript
interface InventoryEvent {
  type: 'CHECK_INVENTORY' | 'RESERVE_INVENTORY' | 'RELEASE_INVENTORY';
  payload: {
    orderId: string;
    items: {
      itemId: string;
      quantity: number;
    }[];
  };
}
```

### Redis Commands

Common Redis commands used in the application:

```bash
# Publish message to channel
PUBLISH "order:events" "{...}"

# Subscribe to channel
SUBSCRIBE "order:events"

# Set cache with expiry
SET "cache:user:123" "{...}" EX 3600

# Get cache
GET "cache:user:123"

# Store saga event
RPUSH "saga:order:123:events" "{...}"

# Get saga events
LRANGE "saga:order:123:events" 0 -1
```

## Database Schema

### Order Service Schema

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  grocery_item_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

### Code Style

- Follow the .editorconfig settings
- Use ESLint for code linting
- Use Prettier for code formatting
