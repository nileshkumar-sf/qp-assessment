import {Injectable, Logger, Inject} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';
import {
  BaseSaga,
  MessagePatterns,
  OrderSagaData,
  OrderStatus,
  SagaDefinition,
  RedisService,
} from '@grocery-booking-api/shared';
import {firstValueFrom} from 'rxjs';

@Injectable()
export class OrderSaga extends BaseSaga<OrderSagaData> {
  constructor(
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryClient: ClientProxy,
    protected readonly redisService: RedisService,
    private readonly logger: Logger,
  ) {
    super(redisService, 'ORDER_SAGA');
  }

  async startOrderSaga(data: OrderSagaData): Promise<OrderSagaData> {
    const definition: SagaDefinition<OrderSagaData> = {
      steps: [
        {
          execute: async sagaData => {
            // Step 1: Reserve Inventory
            this.logger.debug(
              `Reserving inventory for order ${sagaData.orderId}`,
            );
            const inventoryResult = await firstValueFrom(
              this.inventoryClient.send(MessagePatterns.INVENTORY_RESERVE, {
                orderId: sagaData.orderId,
                items: sagaData.items,
              }),
            );

            if (!inventoryResult.success) {
              throw new Error('Inventory reservation failed');
            }

            // Step 2: Payment (Dummy implementation - always succeeds)
            this.logger.debug(
              `Processing payment for order ${sagaData.orderId}`,
            );
            const dummyPaymentResult = {
              success: true,
              paymentId: `dummy-payment-${sagaData.orderId}`,
            };

            return {
              ...sagaData,
              paymentId: dummyPaymentResult.paymentId,
              status: OrderStatus.COMPLETED,
            };
          },
          compensate: async sagaData => {
            // Release inventory
            await firstValueFrom(
              this.inventoryClient.emit(MessagePatterns.INVENTORY_RELEASE, {
                orderId: sagaData.orderId,
                items: sagaData.items,
              }),
            );
          },
        },
      ],
      data,
    };

    return this.executeSaga(definition);
  }

  async getOrderSagaState(orderId: string): Promise<OrderSagaData | null> {
    const state = await this.getSagaState(orderId);
    return state?.data || null;
  }
}
