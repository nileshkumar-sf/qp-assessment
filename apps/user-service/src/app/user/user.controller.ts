import {Controller, Inject} from '@nestjs/common';
import {MessagePattern, Payload} from '@nestjs/microservices';
import {UserService} from './user.service';
import {MessagePatterns} from '@grocery-booking-api/shared';
import {ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';
import {CreateUserDto} from '@grocery-booking-api/shared';

@ApiTags('User')
@Controller()
export class UserController {
  constructor(
    @Inject('USER_SERVICE')
    private readonly userService: UserService,
  ) {}

  @ApiOperation({summary: 'Create a new user'})
  @ApiResponse({status: 201, description: 'User created successfully'})
  @MessagePattern(MessagePatterns.USER_CREATE)
  async createUser(@Payload() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({summary: 'Get user by email'})
  @ApiResponse({status: 200, description: 'Returns the requested user'})
  @MessagePattern(MessagePatterns.USER_GET)
  async getUser(@Payload() id: string) {
    return this.userService.findOne(id);
  }

  @ApiOperation({summary: 'Get all users'})
  @ApiResponse({status: 200, description: 'Returns list of all users'})
  @MessagePattern(MessagePatterns.USER_GET_ALL)
  async getAllUsers() {
    return this.userService.findAll();
  }

  @ApiOperation({summary: 'Update user'})
  @ApiResponse({status: 200, description: 'User updated successfully'})
  @MessagePattern(MessagePatterns.USER_UPDATE)
  async updateUser(
    @Payload() data: {id: string; updates: Partial<CreateUserDto>},
  ) {
    return this.userService.update(data.id, data.updates);
  }

  @ApiOperation({summary: 'Delete user'})
  @ApiResponse({status: 200, description: 'User deleted successfully'})
  @MessagePattern(MessagePatterns.USER_DELETE)
  async deleteUser(@Payload() id: string) {
    return this.userService.remove(id);
  }

  @ApiOperation({summary: 'Get all orders for a user'})
  @ApiResponse({status: 200, description: 'Returns list of user orders'})
  @MessagePattern(MessagePatterns.USER_LIST_ORDERS)
  async listUserOrders(@Payload() userId: string) {
    return this.userService.getOrders(userId);
  }

  @ApiOperation({summary: 'Get a specific order for a user'})
  @ApiResponse({status: 200, description: 'Returns the requested order'})
  @MessagePattern(MessagePatterns.USER_GET_ORDER)
  async getUserOrder(@Payload() data: {userId: string; orderId: string}) {
    return this.userService.getOrder(data.userId, data.orderId);
  }

  @ApiOperation({summary: 'Create a new order'})
  @ApiResponse({status: 201, description: 'Order created successfully'})
  @MessagePattern(MessagePatterns.ORDER_CREATE)
  async createOrder(@Payload() data: {userId: string; items: any[]}) {
    return this.userService.createOrder(data.userId, data.items);
  }
}
