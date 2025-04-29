import {Test, TestingModule} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {UserService} from './user.service';
import {
  User,
  Order,
  OrderItem,
  RedisService,
  OrderStatus,
} from '@grocery-booking-api/shared';
import {ClientProxy} from '@nestjs/microservices';
import {of} from 'rxjs';
import {NotFoundException} from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let orderRepository: Repository<Order>;
  let userClient: ClientProxy;
  let inventoryClient: ClientProxy;
  let redisService: RedisService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'USER',
  };

  const mockOrder = {
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

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUserClient = {
    send: jest.fn(),
  };

  const mockInventoryClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'USER_SERVICE',
          useValue: mockUserClient,
        },
        {
          provide: 'INVENTORY_SERVICE',
          useValue: mockInventoryClient,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    orderRepository = module.get<Repository<Order>>(getRepositoryToken(Order));
    userClient = module.get<ClientProxy>('USER_SERVICE');
    inventoryClient = module.get<ClientProxy>('INVENTORY_SERVICE');
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrders', () => {
    it('should return all orders for a user', async () => {
      const userId = '1';
      const mockOrders = [mockOrder];
      jest.spyOn(orderRepository, 'find').mockResolvedValue(mockOrders);

      const result = await service.getOrders(userId);

      expect(result).toEqual(mockOrders);
      expect(orderRepository.find).toHaveBeenCalledWith({
        where: {userId},
        order: {createdAt: 'DESC'},
      });
    });
  });

  describe('getOrder', () => {
    it('should return a specific order', async () => {
      const userId = '1';
      const orderId = '1';
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(mockOrder);

      const result = await service.getOrder(userId, orderId);

      expect(result).toEqual(mockOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: {id: orderId, userId},
      });
    });

    it('should throw NotFoundException when order is not found', async () => {
      const userId = '1';
      const orderId = '999';
      jest.spyOn(orderRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getOrder(userId, orderId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createOrder', () => {
    const userId = '1';
    const items: OrderItem[] = [
      {
        id: '1',
        orderId: '1',
        groceryItemId: '1',
        quantity: 2,
        price: 10,
      },
    ];

    it('should create a new order when inventory is available', async () => {
      const inventoryCheckResponse = {available: true};
      jest
        .spyOn(inventoryClient, 'send')
        .mockReturnValue(of(inventoryCheckResponse));
      jest.spyOn(orderRepository, 'create').mockReturnValue(mockOrder);
      jest.spyOn(orderRepository, 'save').mockResolvedValue(mockOrder);
      jest.spyOn(userClient, 'send').mockReturnValue(of({}));

      const result = await service.createOrder(userId, items);

      expect(result).toEqual(mockOrder);
      expect(inventoryClient.send).toHaveBeenCalledWith('INVENTORY_CHECK', {
        items,
      });
      expect(orderRepository.create).toHaveBeenCalledWith({
        userId,
        items,
        status: 'PENDING',
      });
      expect(orderRepository.save).toHaveBeenCalledWith(mockOrder);
      expect(userClient.send).toHaveBeenCalledWith('ORDER_PROCESS', {
        order: mockOrder,
      });
    });

    it('should throw error when inventory is not available', async () => {
      const inventoryCheckResponse = {available: false};
      jest
        .spyOn(inventoryClient, 'send')
        .mockReturnValue(of(inventoryCheckResponse));

      await expect(service.createOrder(userId, items)).rejects.toThrow(
        'Some items are not available in the inventory',
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
      jest.spyOn(userClient, 'send').mockReturnValue(of({}));

      const result = await service.updateOrderStatus(orderId, status);

      expect(result).toEqual(updatedOrder);
      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: {id: orderId},
      });
      expect(orderRepository.save).toHaveBeenCalledWith({
        ...mockOrder,
        status,
      });
      expect(userClient.send).toHaveBeenCalledWith('ORDER_UPDATE', {
        orderId,
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
