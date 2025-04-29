import {
  IsUUID,
  IsArray,
  IsNumber,
  IsEnum,
  IsDate,
  ValidateNested,
  Min,
} from 'class-validator';
import {Type} from 'class-transformer';
import {OrderStatus} from '../enums/order-status.enum';
import {OrderItem} from '../entities/order.entity';
import {ApiProperty} from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Grocery item ID',
  })
  @IsUUID()
  groceryItemId!: string;

  @ApiProperty({example: 2, description: 'Quantity of the item', minimum: 1})
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({example: 10.99, description: 'Price per unit', minimum: 0})
  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({
    type: [CreateOrderItemDto],
    example: [
      {
        groceryItemId: '123e4567-e89b-12d3-a456-426614174000',
        quantity: 2,
        price: 10.99,
      },
    ],
    description: 'List of order items',
  })
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiProperty({example: 21.98, description: 'Total order amount', minimum: 0})
  @IsNumber()
  @Min(0)
  totalAmount!: number;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Order ID',
  })
  @IsUUID()
  orderId!: string;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    description: 'New order status',
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

export class OrderResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Order ID',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID',
  })
  @IsUUID()
  userId!: string;

  @ApiProperty({type: [OrderItem], description: 'Order items'})
  @IsArray()
  @ValidateNested({each: true})
  @Type(() => OrderItem)
  items!: OrderItem[];

  @ApiProperty({example: 21.98, description: 'Total order amount', minimum: 0})
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    description: 'Order status',
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiProperty({
    example: '2024-04-15T12:00:00Z',
    description: 'Order creation timestamp',
  })
  @IsDate()
  createdAt!: Date;

  @ApiProperty({
    example: '2024-04-15T12:00:00Z',
    description: 'Order last update timestamp',
  })
  @IsDate()
  updatedAt!: Date;
}
