import {Test, TestingModule} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {OrderService} from './order.service';
import {Order, OrderStatus} from '@grocery-booking-api/shared';
import {of} from 'rxjs';
import {NotFoundException} from '@nestjs/common';
import {OrderSaga} from './sagas/order.saga';
import {RedisService} from '@grocery-booking-api/shared';

// Mock crypto module
jest.mock('crypto', () => ({
  randomUUID: () => 'test-uuid',
  createHash: () => ({
    update: () => ({
      digest: () => 'test-hash',
    }),
  }),
}));

describe('OrderService', () => {
  let service: OrderService;
  let orderRepository: Repository<Order>;
  let orderSaga: OrderSaga;
  let redisService: RedisService;

  const mockOrder = {
    id: '1',
    userId: '1',
    items: [
      {
        id: '1',
        orderId: '1',
        groceryItemId: 'item1',
        quantity: 2,
        price: 10,
      },
    ],
    totalAmount: 20,
    status: OrderStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn().mockResolvedValue([mockOrder]),
            findOne: jest.fn().mockResolvedValue(mockOrder),
            save: jest.fn().mockImplementation(order => {
              if (order.status === OrderStatus.PENDING) {
                return Promise.resolve(mockOrder);
              }
              return Promise.resolve({...mockOrder, status: order.status});
            }),
            update: jest.fn().mockResolvedValue({affected: 1}),
          },
        },
        {
          provide: 'INVENTORY_SERVICE',
          useValue: {
            send: jest.fn().mockReturnValue(of({success: true})),
          },
        },
        {
          provide: OrderSaga,
          useValue: {
            startOrderSaga: jest.fn().mockImplementation(data =>
              Promise.resolve({
                ...data,
                status: OrderStatus.COMPLETED,
              }),
            ),
            getOrderSagaState: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn().mockResolvedValue('OK'),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    orderSaga = module.get<OrderSaga>(OrderSaga);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrders', () => {
    it('should return all orders', async () => {
      const mockOrders = [mockOrder];
      jest.spyOn(orderRepository, 'find').mockResolvedValue(mockOrders);

      const result = await service.getOrderById('1');

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: {id: '1'},
        relations: ['items'],
      });
    });
  });

  describe('getOrder', () => {
    it('should return a specific order', async () => {
      const orderId = '1';
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockOrder);

      const result = await service.getOrderById(orderId);

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: {id: orderId},
        relations: ['items'],
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      const orderId = '999';
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getOrderById(orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('processOrder', () => {
    it('should process order successfully', async () => {
      const orderData = {
        userId: '1',
        items: mockOrder.items,
        totalAmount: 20,
      };
      const idempotencyKey = 'test-key';
      const sagaData = {
        orderId: mockOrder.id,
        userId: mockOrder.userId,
        items: mockOrder.items.map(item => ({
          itemId: item.groceryItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        status: OrderStatus.COMPLETED,
        idempotencyKey,
        totalAmount: mockOrder.totalAmount,
      };

      const completedOrder = {...mockOrder, status: OrderStatus.COMPLETED};

      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(orderRepository, 'save').mockImplementation(order => {
        if (order.status === OrderStatus.PENDING) {
          return Promise.resolve(mockOrder);
        }
        return Promise.resolve(completedOrder);
      });
      jest.spyOn(orderSaga, 'startOrderSaga').mockResolvedValue(sagaData);

      const result = await service.processOrder(orderData, idempotencyKey);

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...mockOrder,
        status: OrderStatus.COMPLETED,
      });
    });

    it('should handle inventory failure', async () => {
      const orderData = {
        userId: '1',
        items: mockOrder.items,
        totalAmount: 20,
      };
      const idempotencyKey = 'test-key';
      const sagaData = {
        orderId: mockOrder.id,
        userId: mockOrder.userId,
        items: mockOrder.items.map(item => ({
          itemId: item.groceryItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        status: OrderStatus.FAILED,
        idempotencyKey,
        totalAmount: mockOrder.totalAmount,
      };

      const failedOrder = {...mockOrder, status: OrderStatus.FAILED};

      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(orderRepository, 'save').mockImplementation(order => {
        if (order.status === OrderStatus.PENDING) {
          return Promise.resolve(mockOrder);
        }
        return Promise.resolve(failedOrder);
      });
      jest.spyOn(orderSaga, 'startOrderSaga').mockResolvedValue(sagaData);

      const result = await service.processOrder(orderData, idempotencyKey);

      expect(result.status).toBe(OrderStatus.FAILED);
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...mockOrder,
        status: OrderStatus.FAILED,
      });
    });

    it('should handle payment failure', async () => {
      const orderData = {
        userId: '1',
        items: mockOrder.items,
        totalAmount: 20,
      };
      const idempotencyKey = 'test-key';
      const sagaData = {
        orderId: mockOrder.id,
        userId: mockOrder.userId,
        items: mockOrder.items.map(item => ({
          itemId: item.groceryItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        status: OrderStatus.FAILED,
        idempotencyKey,
        totalAmount: mockOrder.totalAmount,
      };

      const failedOrder = {...mockOrder, status: OrderStatus.FAILED};

      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(orderRepository, 'save').mockImplementation(order => {
        if (order.status === OrderStatus.PENDING) {
          return Promise.resolve(mockOrder);
        }
        return Promise.resolve(failedOrder);
      });
      jest.spyOn(orderSaga, 'startOrderSaga').mockResolvedValue(sagaData);

      const result = await service.processOrder(orderData, idempotencyKey);

      expect(result.status).toBe(OrderStatus.FAILED);
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...mockOrder,
        status: OrderStatus.FAILED,
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      const orderData = {
        userId: '1',
        items: mockOrder.items,
        totalAmount: 20,
      };
      const idempotencyKey = 'test-key';

      jest
        .spyOn(redisService, 'get')
        .mockResolvedValue('non-existent-order-id');
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.processOrder(orderData, idempotencyKey),
      ).rejects.toThrow(NotFoundException);
    });

    it('should process order and store idempotency key', async () => {
      const orderData = {
        userId: '1',
        items: [
          {
            groceryItemId: 'item1',
            quantity: 2,
            price: 10,
          },
        ],
        totalAmount: 20,
      };
      const idempotencyKey = 'test-key';
      const sagaData = {
        orderId: mockOrder.id,
        userId: mockOrder.userId,
        items: mockOrder.items.map(item => ({
          itemId: item.groceryItemId,
          quantity: item.quantity,
          price: item.price,
        })),
        status: mockOrder.status,
        idempotencyKey,
        totalAmount: mockOrder.totalAmount,
      };

      jest.spyOn(redisService, 'get').mockResolvedValue(null);
      jest.spyOn(orderRepository, 'save').mockResolvedValue(mockOrder);
      jest.spyOn(orderSaga, 'startOrderSaga').mockResolvedValue(sagaData);

      const result = await service.processOrder(orderData, idempotencyKey);

      expect(result).toEqual(mockOrder);
      expect(redisService.set).toHaveBeenCalledWith(
        `order:${idempotencyKey}`,
        mockOrder.id,
        24 * 60 * 60, // 24 hours expiry
      );
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status', async () => {
      const orderId = '1';
      const status = OrderStatus.COMPLETED;
      const updatedOrder = {...mockOrder, status};

      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockOrder);
      jest.spyOn(orderRepository, 'save').mockResolvedValue(updatedOrder);

      const result = await service.updateOrderStatus(orderId, status);

      expect(result).toEqual(updatedOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: {id: orderId},
        relations: ['items'],
      });
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...mockOrder,
        status,
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      const orderId = '999';
      const status = OrderStatus.COMPLETED;
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateOrderStatus(orderId, status)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
