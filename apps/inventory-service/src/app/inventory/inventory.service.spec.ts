import {Test, TestingModule} from '@nestjs/testing';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {InventoryService} from './inventory.service';
import {GroceryItem, OrderItem} from '@grocery-booking-api/shared';
import {ClientProxy} from '@nestjs/microservices';
import {of} from 'rxjs';
import {NotFoundException} from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let groceryItemRepository: Repository<GroceryItem>;
  let orderClient: ClientProxy;

  const mockGroceryItem = {
    id: '1',
    name: 'Test Item',
    description: 'Test Description',
    price: 10,
    quantity: 100,
    unit: 'kg',
    categories: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOrderClient = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(GroceryItem),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: 'ORDER_SERVICE',
          useValue: mockOrderClient,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    groceryItemRepository = module.get<Repository<GroceryItem>>(
      getRepositoryToken(GroceryItem),
    );
    orderClient = module.get<ClientProxy>('ORDER_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getItems', () => {
    it('should return all grocery items', async () => {
      const mockItems = [mockGroceryItem];
      jest.spyOn(groceryItemRepository, 'find').mockResolvedValue(mockItems);

      const result = await service.getItems();

      expect(result).toEqual(mockItems);
      expect(groceryItemRepository.find).toHaveBeenCalled();
    });
  });

  describe('getItem', () => {
    it('should return a specific grocery item', async () => {
      const itemId = '1';
      jest
        .spyOn(groceryItemRepository, 'findOne')
        .mockResolvedValue(mockGroceryItem);

      const result = await service.getItem(itemId);

      expect(result).toEqual(mockGroceryItem);
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: itemId},
      });
    });

    it('should throw NotFoundException when item is not found', async () => {
      const itemId = '999';
      jest.spyOn(groceryItemRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getItem(itemId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('checkInventory', () => {
    it('should return true when all items are available', async () => {
      const items: OrderItem[] = [
        {
          id: '1',
          orderId: '1',
          groceryItemId: '1',
          quantity: 2,
          price: 10,
        },
      ];

      jest
        .spyOn(groceryItemRepository, 'findOne')
        .mockResolvedValue(mockGroceryItem);

      const result = await service.checkInventory(items);

      expect(result.available).toBe(true);
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: items[0].groceryItemId},
      });
    });

    it('should return false when an item is not available', async () => {
      const items: OrderItem[] = [
        {
          id: '1',
          orderId: '1',
          groceryItemId: '1',
          quantity: 200,
          price: 10,
        },
      ];

      jest
        .spyOn(groceryItemRepository, 'findOne')
        .mockResolvedValue(mockGroceryItem);

      const result = await service.checkInventory(items);

      expect(result.available).toBe(false);
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: items[0].groceryItemId},
      });
    });
  });

  describe('reserveInventory', () => {
    it('should reserve inventory successfully', async () => {
      const orderId = '1';
      const items: OrderItem[] = [
        {
          id: '1',
          orderId: '1',
          groceryItemId: '1',
          quantity: 2,
          price: 10,
        },
      ];

      jest
        .spyOn(groceryItemRepository, 'findOne')
        .mockResolvedValue(mockGroceryItem);
      jest.spyOn(groceryItemRepository, 'save').mockResolvedValue({
        ...mockGroceryItem,
        quantity: mockGroceryItem.quantity - items[0].quantity,
      });

      const result = await service.reserveInventory(orderId, items);

      expect(result.success).toBe(true);
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: items[0].groceryItemId},
      });
      expect(groceryItemRepository.save).toHaveBeenCalledWith({
        ...mockGroceryItem,
        quantity: mockGroceryItem.quantity - items[0].quantity,
      });
    });

    it('should handle insufficient inventory', async () => {
      const orderId = '1';
      const items: OrderItem[] = [
        {
          id: '1',
          orderId: '1',
          groceryItemId: '1',
          quantity: 200,
          price: 10,
        },
      ];

      jest
        .spyOn(groceryItemRepository, 'findOne')
        .mockResolvedValue(mockGroceryItem);

      const result = await service.reserveInventory(orderId, items);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Insufficient inventory');
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: items[0].groceryItemId},
      });
      expect(groceryItemRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('releaseInventory', () => {
    it('should release inventory successfully', async () => {
      const orderId = '1';
      const items: OrderItem[] = [
        {
          id: '1',
          orderId: '1',
          groceryItemId: '1',
          quantity: 2,
          price: 10,
        },
      ];

      jest
        .spyOn(groceryItemRepository, 'findOne')
        .mockResolvedValue(mockGroceryItem);
      jest.spyOn(groceryItemRepository, 'save').mockResolvedValue({
        ...mockGroceryItem,
        quantity: mockGroceryItem.quantity + items[0].quantity,
      });

      const result = await service.releaseInventory(orderId, items);

      expect(result.success).toBe(true);
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: items[0].groceryItemId},
      });
      expect(groceryItemRepository.save).toHaveBeenCalledWith({
        ...mockGroceryItem,
        quantity: mockGroceryItem.quantity + items[0].quantity,
      });
    });

    it('should handle item not found', async () => {
      const orderId = '1';
      const items: OrderItem[] = [
        {
          id: '1',
          orderId: '1',
          groceryItemId: '999',
          quantity: 2,
          price: 10,
        },
      ];

      jest.spyOn(groceryItemRepository, 'findOne').mockResolvedValue(null);

      const result = await service.releaseInventory(orderId, items);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Item not found');
      expect(groceryItemRepository.findOne).toHaveBeenCalledWith({
        where: {id: items[0].groceryItemId},
      });
      expect(groceryItemRepository.save).not.toHaveBeenCalled();
    });
  });
});
