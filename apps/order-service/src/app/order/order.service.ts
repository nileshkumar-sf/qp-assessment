import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {OrderSaga} from './sagas/order.saga';
import {
  Order,
  OrderStatus,
  CreateOrderDto,
  OrderItem,
  OrderSagaData,
  RedisService,
} from '@grocery-booking-api/shared';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly orderSaga: OrderSaga,
    private readonly redisService: RedisService,
  ) {}

  async processOrder(
    orderData: CreateOrderDto,
    idempotencyKey: string,
  ): Promise<Order> {
    // Check idempotency
    const existingOrderId = await this.redisService.get(
      `order:${idempotencyKey}`,
    );
    if (existingOrderId) {
      const existingOrder = await this.orderRepository.findOne({
        where: {id: existingOrderId},
        relations: ['items'],
      });
      if (!existingOrder) {
        throw new NotFoundException(
          'Order not found despite having idempotency key',
        );
      }
      return existingOrder;
    }

    const order = new Order();
    try {
      // Create initial order with PENDING status
      order.userId = orderData.userId;
      order.totalAmount = orderData.totalAmount;
      order.status = OrderStatus.PENDING;
      order.items = orderData.items.map(item => {
        const orderItem = new OrderItem();
        orderItem.groceryItemId = item.groceryItemId;
        orderItem.quantity = item.quantity;
        orderItem.price = item.price;
        return orderItem;
      });

      const savedOrder = await this.orderRepository.save(order);

      // Store idempotency key
      await this.redisService.set(
        `order:${idempotencyKey}`,
        savedOrder.id,
        24 * 60 * 60, // 24 hours expiry
      );

      // Execute order saga
      const sagaData: OrderSagaData = {
        orderId: savedOrder.id,
        userId: savedOrder.userId,
        items: savedOrder.items.map(item => ({
          itemId: item.groceryItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        status: savedOrder.status,
        idempotencyKey,
        totalAmount: savedOrder.totalAmount,
      };

      const sagaResult = await this.orderSaga.startOrderSaga(sagaData);

      // Update order with saga result
      const updatedOrder = await this.orderRepository.save({
        ...savedOrder,
        status: sagaResult.status,
      });

      return updatedOrder;
    } catch (error) {
      // Handle saga failure
      if (order.id) {
        const failedOrder = await this.orderRepository.save({
          ...order,
          status: OrderStatus.FAILED,
        });

        // Log the error for monitoring
        console.error('Order processing failed:', {
          orderId: failedOrder.id,
          error: error.message,
          stack: error.stack,
        });
      }

      throw new Error(`Order processing failed: ${error.message}`);
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: {id: orderId},
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    return this.orderRepository.save(order);
  }

  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: {id: orderId},
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async getOrderSagaState(orderId: string): Promise<OrderSagaData | null> {
    return this.orderSaga.getOrderSagaState(orderId);
  }
}
