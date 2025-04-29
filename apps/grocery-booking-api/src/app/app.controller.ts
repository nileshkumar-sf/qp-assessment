import {Controller, Post, Get, Put, Delete, Body, Param} from '@nestjs/common';
import {AppService} from './app.service';
import {
  Public,
  CreateUserDto,
  MessagePatterns,
  LoginDto,
  Roles,
  UserRole,
  CreateOrderDto,
  CreateGroceryItemDto,
  UpdateGroceryItemDto,
  UpdateInventoryDto,
} from '@grocery-booking-api/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Public routes (no authentication required)
  @Public()
  @Post('auth/register')
  async register(@Body() createUserDto: CreateUserDto) {
    console.log('register', createUserDto);
    return this.appService.forwardRequest(
      'auth',
      MessagePatterns.AUTH_REGISTER,
      createUserDto,
    );
  }

  @Public()
  @Post('auth/login')
  async login(@Body() loginDto: LoginDto) {
    return this.appService.forwardRequest(
      'auth',
      MessagePatterns.AUTH_LOGIN,
      loginDto,
    );
  }

  // User endpoints (requires authentication)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('items/available')
  async getAvailableItems() {
    return this.appService.forwardRequest(
      'inventory',
      MessagePatterns.USER_LIST_ITEMS,
      {},
    );
  }

  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post('orders')
  async createOrder(@Body() orderData: CreateOrderDto) {
    return this.appService.forwardRequest(
      'order',
      MessagePatterns.ORDER_PROCESS,
      orderData,
    );
  }

  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('orders/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    return this.appService.forwardRequest(
      'order',
      MessagePatterns.USER_LIST_ITEMS,
      {
        userId,
      },
    );
  }

  // Admin endpoints
  @Roles(UserRole.ADMIN)
  @Post('items')
  async createItem(@Body() itemData: CreateGroceryItemDto) {
    return this.appService.forwardRequest(
      'admin',
      MessagePatterns.ADMIN_CREATE_ITEM,
      itemData,
    );
  }

  @Roles(UserRole.ADMIN)
  @Put('items/:itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() itemData: UpdateGroceryItemDto,
  ) {
    return this.appService.forwardRequest(
      'admin',
      MessagePatterns.ADMIN_UPDATE_ITEM,
      {
        itemId,
        ...itemData,
      },
    );
  }

  @Roles(UserRole.ADMIN)
  @Delete('items/:itemId')
  async deleteItem(@Param('itemId') itemId: string) {
    return this.appService.forwardRequest(
      'admin',
      MessagePatterns.ADMIN_DELETE_ITEM,
      {itemId},
    );
  }

  @Roles(UserRole.ADMIN)
  @Put('inventory/:itemId')
  async updateInventory(
    @Param('itemId') itemId: string,
    @Body() inventoryData: UpdateInventoryDto,
  ) {
    return this.appService.forwardRequest(
      'admin',
      MessagePatterns.ADMIN_UPDATE_INVENTORY,
      {
        itemId,
        ...inventoryData,
      },
    );
  }

  @Get()
  getData() {
    return {message: 'Hello API'};
  }
}
