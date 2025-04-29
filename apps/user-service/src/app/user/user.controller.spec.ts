import {Test, TestingModule} from '@nestjs/testing';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {Order, CreateOrderDto, OrderStatus} from '@grocery-booking-api/shared';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    createOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOrders', () => {
    it('should return all orders for a user', async () => {
      const userId = '1';
      const mockOrders: Order[] = [
        {
          id: '1',
          userId: '1',
          items: [
            {
              id: '1',
              orderId: '1',
              groceryItemId: '1',
              quantity: 2,
              price: 10,
            },
          ],
          totalAmount: 20,
          status: OrderStatus.PENDING,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.getOrders.mockResolvedValue(mockOrders);

      const result = await controller.getOrders(userId);

      expect(result).toEqual(mockOrders);
      expect(mockUserService.getOrders).toHaveBeenCalledWith(userId);
    });
  });

  describe('getOrder', () => {
    it('should return a specific order', async () => {
      const userId = '1';
      const orderId = '1';
      const mockOrder: Order = {
        id: '1',
        userId: '1',
        items: [
          {
            id: '1',
            orderId: '1',
            groceryItemId: '1',
            quantity: 2,
            price: 10,
          },
        ],
        totalAmount: 20,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.getOrder.mockResolvedValue(mockOrder);

      const result = await controller.getOrder({userId, orderId});

      expect(result).toEqual(mockOrder);
      expect(mockUserService.getOrder).toHaveBeenCalledWith(userId, orderId);
    });

    it('should throw error when order is not found', async () => {
      const userId = '1';
      const orderId = '999';

      mockUserService.getOrder.mockRejectedValue(new Error('Order not found'));

      await expect(controller.getOrder({userId, orderId})).rejects.toThrow(
        'Order not found',
      );
    });
  });

  describe('createOrder', () => {
    it('should create a new order', async () => {
      const createOrderDto: CreateOrderDto = {
        userId: '1',
        items: [
          {
            groceryItemId: '1',
            quantity: 2,
            price: 10,
          },
        ],
        totalAmount: 20,
      };

      const mockOrder: Order = {
        id: '1',
        userId: '1',
        items: [
          {
            id: '1',
            orderId: '1',
            groceryItemId: '1',
            quantity: 2,
            price: 10,
          },
        ],
        totalAmount: 20,
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserService.createOrder.mockResolvedValue(mockOrder);

      const result = await controller.createOrder(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockUserService.createOrder).toHaveBeenCalledWith(
        createOrderDto.userId,
        createOrderDto.items.map(item => ({
          ...item,
          id: '',
          orderId: '',
        })),
      );
    });
  });
});
