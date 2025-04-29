import {Controller} from '@nestjs/common';
import {MessagePattern, Payload} from '@nestjs/microservices';
import {InventoryService} from './inventory.service';
import {MessagePatterns} from '@grocery-booking-api/shared';
import {GroceryItem} from '@grocery-booking-api/shared';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({summary: 'Check inventory availability'})
  @ApiResponse({
    status: 200,
    description: 'Returns inventory availability and quantity',
    schema: {
      type: 'object',
      properties: {
        available: {type: 'boolean'},
        quantity: {type: 'number'},
      },
    },
  })
  @MessagePattern(MessagePatterns.INVENTORY_CHECK)
  async checkInventory(
    @Payload() itemId: string,
  ): Promise<{available: boolean; quantity: number}> {
    return this.inventoryService.checkInventory(itemId);
  }

  @ApiOperation({summary: 'Update inventory level'})
  @ApiResponse({
    status: 200,
    description: 'Returns updated grocery item',
    type: GroceryItem,
  })
  @MessagePattern(MessagePatterns.INVENTORY_UPDATE)
  async updateInventoryLevel(
    @Payload() data: {itemId: string; quantity: number},
  ): Promise<GroceryItem> {
    return this.inventoryService.updateInventoryLevel(
      data.itemId,
      data.quantity,
    );
  }

  @ApiOperation({summary: 'Reserve inventory for an order'})
  @ApiResponse({
    status: 200,
    description: 'Returns true if reservation was successful',
  })
  @MessagePattern(MessagePatterns.INVENTORY_RESERVE)
  async reserveInventory(
    @Payload()
    data: {
      orderId: string;
      items: {itemId: string; quantity: number}[];
    },
  ): Promise<boolean> {
    return this.inventoryService.reserveInventory(data.orderId, data.items);
  }

  @ApiOperation({summary: 'Release reserved inventory'})
  @ApiResponse({status: 200, description: 'Inventory released successfully'})
  @MessagePattern(MessagePatterns.INVENTORY_RELEASE)
  async releaseInventory(
    @Payload()
    data: {
      orderId: string;
      items: {itemId: string; quantity: number}[];
    },
  ): Promise<void> {
    return this.inventoryService.releaseInventory(data.orderId, data.items);
  }
}
