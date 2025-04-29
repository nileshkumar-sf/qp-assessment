import {Controller} from '@nestjs/common';
import {MessagePattern, Payload} from '@nestjs/microservices';
import {AdminService} from './admin.service';
import {MessagePatterns} from '@grocery-booking-api/shared';
import {GroceryItem} from '@grocery-booking-api/shared';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @MessagePattern(MessagePatterns.ADMIN_CREATE_ITEM)
  async createItem(
    @Payload() item: Partial<GroceryItem>,
  ): Promise<GroceryItem> {
    return this.adminService.createItem(item);
  }

  @MessagePattern(MessagePatterns.ADMIN_LIST_ITEMS)
  async getItems(): Promise<GroceryItem[]> {
    return this.adminService.getItems();
  }

  @MessagePattern(MessagePatterns.ADMIN_GET_ITEM)
  async getItem(@Payload() id: string): Promise<GroceryItem> {
    return this.adminService.getItem(id);
  }

  @MessagePattern(MessagePatterns.ADMIN_UPDATE_ITEM)
  async updateItem(
    @Payload() data: {id: string; updates: Partial<GroceryItem>},
  ): Promise<GroceryItem> {
    return this.adminService.updateItem(data.id, data.updates);
  }

  @MessagePattern(MessagePatterns.ADMIN_DELETE_ITEM)
  async deleteItem(@Payload() id: string): Promise<void> {
    return this.adminService.deleteItem(id);
  }

  @MessagePattern(MessagePatterns.ADMIN_UPDATE_INVENTORY)
  async updateInventory(
    @Payload() data: {id: string; quantity: number},
  ): Promise<GroceryItem> {
    return this.adminService.updateInventory(data.id, data.quantity);
  }
}
