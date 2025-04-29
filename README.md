# Grocery Booking API

A microservices-based grocery booking system built with NestJS, PostgreSQL, and Redis.

## High-Level Design

### 1. Service Architecture

The system follows a microservices architecture with event driven Pub-Sub for inter-service communication:


### 3. Communication Patterns

Event driven system for inter service communication using Redis Queues Pub/Sub.

### 4. Saga Pattern Implementation

The Saga pattern is implemented to manage distributed transactions across microservices. It ensures data consistency and reliability by breaking a transaction into a series of smaller, isolated steps, each with a compensating action in case of failure.

## Performance Optimization

### 1. Data Consistency

- **Cache Invalidation**: Time-based and event-based strategies
- **Write-Through**: Update cache and database simultaneously
- **Cache-Aside**: Lazy loading for infrequently accessed data
