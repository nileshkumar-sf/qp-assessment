import {OrderStatus} from '../enums/order-status.enum';

export interface SagaStep<TData, TResult = TData> {
  execute: (data: TData) => Promise<TResult>;
  compensate: (data: TData) => Promise<void>;
}

export interface SagaDefinition<TData> {
  steps: SagaStep<TData>[];
  data: TData;
}

export interface OrderSagaData {
  orderId: string;
  userId: string;
  items: {
    itemId: string;
    quantity: number;
    price: number;
  }[];
  status: OrderStatus;
  idempotencyKey: string;
  totalAmount: number;
  paymentId?: string;
}
