import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import {OrderService} from './order.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
  OrderSagaData,
} from '@grocery-booking-api/shared';
import {ApiOperation, ApiResponse, ApiTags, ApiHeader} from '@nestjs/swagger';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({summary: 'Create a new order'})
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiHeader({
    name: 'idempotency-key',
    description: 'Idempotency key to prevent duplicate orders',
  })
  @Post()
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ): Promise<OrderResponseDto> {
    if (!idempotencyKey) {
      throw new Error('Idempotency key is required');
    }

    const order = await this.orderService.processOrder(
      createOrderDto,
      idempotencyKey,
    );
    return this.mapToResponseDto(order);
  }

  @ApiOperation({summary: 'Update order status'})
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @Put(':orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    const order = await this.orderService.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
    );
    return this.mapToResponseDto(order);
  }

  @ApiOperation({summary: 'Get order details'})
  @ApiResponse({
    status: 200,
    description: 'Returns the requested order',
    type: OrderResponseDto,
  })
  @Get(':orderId')
  async getOrder(@Param('orderId') orderId: string): Promise<OrderResponseDto> {
    const order = await this.orderService.getOrderById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return this.mapToResponseDto(order);
  }

  @ApiOperation({summary: 'Get order saga state'})
  @ApiResponse({
    status: 200,
    description: 'Returns the current saga state for the order',
  })
  @Get(':orderId/saga-state')
  async getOrderSagaState(
    @Param('orderId') orderId: string,
  ): Promise<OrderSagaData | null> {
    return this.orderService.getOrderSagaState(orderId);
  }

  private mapToResponseDto(order: any): OrderResponseDto {
    const response = new OrderResponseDto();
    response.id = order.id;
    response.userId = order.userId;
    response.items = order.items;
    response.totalAmount = order.totalAmount;
    response.status = order.status;
    response.createdAt = order.createdAt;
    response.updatedAt = order.updatedAt;
    return response;
  }
}
