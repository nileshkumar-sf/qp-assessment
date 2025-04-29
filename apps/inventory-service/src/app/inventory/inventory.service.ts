import {Injectable, Inject, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {
  GroceryItem,
  RedisService,
  MessagePatterns,
} from '@grocery-booking-api/shared';
import {ClientProxy} from '@nestjs/microservices';
import {firstValueFrom} from 'rxjs';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(GroceryItem)
    private readonly itemRepository: Repository<GroceryItem>,
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
    private readonly redisService: RedisService,
  ) {}

  async getItem(itemId: string): Promise<GroceryItem> {
    const item = await this.itemRepository.findOne({where: {id: itemId}});
    if (!item) {
      throw new NotFoundException('Item not found');
    }
    return item;
  }

  private async getCachedItem(itemId: string): Promise<GroceryItem | null> {
    const cachedItem = await this.redisService.get(`item:${itemId}`);
    return cachedItem ? JSON.parse(cachedItem) : null;
  }

  private async cacheItem(item: GroceryItem): Promise<void> {
    await this.redisService.set(`item:${item.id}`, JSON.stringify(item), 3600); // Cache for 1 hour
  }

  async checkInventory(
    itemId: string,
  ): Promise<{available: boolean; quantity: number}> {
    // Try to get from cache first
    const cachedItem = await this.getCachedItem(itemId);
    if (cachedItem) {
      return {
        available: cachedItem.quantity > 0,
        quantity: cachedItem.quantity,
      };
    }

    // If not in cache, get from database
    const item = await this.itemRepository.findOne({where: {id: itemId}});
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Cache the item
    await this.cacheItem(item);

    return {
      available: item.quantity > 0,
      quantity: item.quantity,
    };
  }

  async updateInventoryLevel(
    itemId: string,
    quantity: number,
  ): Promise<GroceryItem> {
    const item = await this.itemRepository.findOne({where: {id: itemId}});
    if (!item) {
      throw new NotFoundException('Item not found');
    }

    item.quantity = quantity;
    const updatedItem = await this.itemRepository.save(item);

    // Update cache
    await this.cacheItem(updatedItem);

    // Notify other services about inventory update through Redis pub/sub
    await firstValueFrom(
      this.inventoryClient.emit(MessagePatterns.INVENTORY_UPDATE, {
        itemId,
        quantity,
      }),
    );

    return updatedItem;
  }

  async reserveInventory(
    orderId: string,
    items: {itemId: string; quantity: number}[],
  ): Promise<boolean> {
    const reservationKey = `reservation:${orderId}`;

    try {
      // Check if reservation exists
      const existingReservation = await this.redisService.get(reservationKey);
      if (existingReservation) {
        return true;
      }

      // Check inventory levels
      for (const item of items) {
        const inventory = await this.checkInventory(item.itemId);
        if (!inventory.available || inventory.quantity < item.quantity) {
          return false;
        }
      }

      // Update inventory and store reservation
      for (const item of items) {
        const currentItem = await this.itemRepository.findOne({
          where: {id: item.itemId},
        });
        const newQuantity = currentItem.quantity - item.quantity;
        await this.updateInventoryLevel(item.itemId, newQuantity);
        await this.redisService.set(
          `inventory:${item.itemId}`,
          newQuantity.toString(),
        );
      }

      // Store reservation with 24 hours expiry
      await this.redisService.set(reservationKey, 'true', 24 * 60 * 60);
      return true;
    } catch (error) {
      await this.releaseInventory(orderId, items);
      return false;
    }
  }

  async releaseInventory(
    orderId: string,
    items: {itemId: string; quantity: number}[],
  ): Promise<void> {
    const reservationKey = `reservation:${orderId}`;

    try {
      // Check if reservation exists
      const existingReservation = await this.redisService.get(reservationKey);
      if (!existingReservation) {
        return;
      }

      // Update inventory and remove reservation
      for (const item of items) {
        const currentItem = await this.itemRepository.findOne({
          where: {id: item.itemId},
        });
        const newQuantity = currentItem.quantity + item.quantity;
        await this.updateInventoryLevel(item.itemId, newQuantity);
        await this.redisService.set(
          `inventory:${item.itemId}`,
          newQuantity.toString(),
        );
      }

      // Remove reservation
      await this.redisService.del(reservationKey);
    } catch (error) {
      console.error(`Failed to release inventory for order ${orderId}:`, error);
    }
  }
}
