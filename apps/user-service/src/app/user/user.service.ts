import {Injectable, Inject, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {
  User,
  Order,
  OrderItem,
  RedisService,
  CreateUserDto,
  OrderStatus,
  UserRole,
} from '@grocery-booking-api/shared';
import {ClientProxy} from '@nestjs/microservices';
import {firstValueFrom} from 'rxjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject('USER_SERVICE')
    private readonly userClient: ClientProxy,
    @Inject('INVENTORY_SERVICE')
    private readonly inventoryClient: ClientProxy,
    private readonly redisService: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    await this.redisService.set(
      `user:${savedUser.id}`,
      JSON.stringify(savedUser),
    );
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({where: {email}});
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const cachedUser = await this.redisService.get(`user:${id}`);
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.userRepository.findOne({where: {id}});
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.redisService.set(`user:${id}`, JSON.stringify(user));
    return user;
  }

  async update(id: string, updates: Partial<CreateUserDto>): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updates);
    const updatedUser = await this.userRepository.save(user);
    await this.redisService.set(`user:${id}`, JSON.stringify(updatedUser));
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    await this.redisService.del(`user:${id}`);
  }

  async getOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: {userId},
      order: {createdAt: 'DESC'},
    });
  }

  async getOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: {id: orderId, userId},
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async createOrder(userId: string, items: OrderItem[]): Promise<Order> {
    const inventoryCheck = await firstValueFrom(
      this.inventoryClient.send('INVENTORY_CHECK', {items}),
    );

    if (!inventoryCheck.available) {
      throw new Error('Some items are not available in the inventory');
    }

    const order = this.orderRepository.create({
      userId,
      items,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    await firstValueFrom(
      this.userClient.send('ORDER_PROCESS', {order: savedOrder}),
    );

    return savedOrder;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: {id: orderId},
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    await firstValueFrom(
      this.userClient.send('ORDER_UPDATE', {orderId, status}),
    );

    return updatedOrder;
  }
}
