import {Injectable, Inject, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {GroceryItem} from '@grocery-booking-api/shared';
import {ClientProxy} from '@nestjs/microservices';
import {MessagePatterns} from '@grocery-booking-api/shared';
import {RedisService} from '@grocery-booking-api/shared';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(GroceryItem)
    private readonly itemRepository: Repository<GroceryItem>,
    @Inject('ADMIN_SERVICE') private readonly adminClient: ClientProxy,
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
    private readonly redisService: RedisService,
  ) {}

  async createItem(item: Partial<GroceryItem>): Promise<GroceryItem> {
    const newItem = this.itemRepository.create(item);
    const savedItem = await this.itemRepository.save(newItem);

    // Notify inventory service about new item
    await this.inventoryClient.emit(
      MessagePatterns.ADMIN_UPDATE_INVENTORY,
      savedItem,
    );

    return savedItem;
  }

  async getItems(): Promise<GroceryItem[]> {
    return this.itemRepository.find();
  }

  async getItem(id: string): Promise<GroceryItem> {
    const item = await this.itemRepository.findOne({where: {id}});
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  async updateItem(
    id: string,
    updates: Partial<GroceryItem>,
  ): Promise<GroceryItem> {
    const item = await this.getItem(id);
    Object.assign(item, updates);
    const updatedItem = await this.itemRepository.save(item);

    // Notify inventory service about item update
    await this.inventoryClient.emit(
      MessagePatterns.ADMIN_UPDATE_INVENTORY,
      updatedItem,
    );

    return updatedItem;
  }

  async deleteItem(id: string): Promise<void> {
    const item = await this.getItem(id);
    await this.itemRepository.remove(item);

    // Notify inventory service about item deletion
    await this.inventoryClient.emit(MessagePatterns.ADMIN_UPDATE_INVENTORY, {
      id,
      deleted: true,
    });
  }

  async updateInventory(id: string, quantity: number): Promise<GroceryItem> {
    const item = await this.getItem(id);
    item.quantity = quantity;
    const updatedItem = await this.itemRepository.save(item);

    // Notify inventory service about quantity update
    await this.inventoryClient.emit(
      MessagePatterns.ADMIN_UPDATE_INVENTORY,
      updatedItem,
    );

    return updatedItem;
  }
}
