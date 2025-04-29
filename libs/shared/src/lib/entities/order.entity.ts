import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import {IsUUID, IsEnum, IsNumber, Min, ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {OrderStatus} from '../enums/order-status.enum';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column()
  @IsUUID()
  orderId!: string;

  @Column()
  @IsUUID()
  groceryItemId!: string;

  @Column()
  @IsNumber()
  @Min(1)
  quantity!: number;

  @Column('decimal', {precision: 10, scale: 2})
  @IsNumber()
  @Min(0)
  price!: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id?: string;

  @Column()
  @IsUUID()
  userId!: string;

  @OneToMany(() => OrderItem, item => item.orderId, {
    cascade: true,
    eager: true,
  })
  @ValidateNested({each: true})
  @Type(() => OrderItem)
  items!: OrderItem[];

  @Column('decimal', {precision: 10, scale: 2})
  @IsNumber()
  @Min(0)
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @CreateDateColumn()
  createdAt?: Date;

  @UpdateDateColumn()
  updatedAt?: Date;
}
