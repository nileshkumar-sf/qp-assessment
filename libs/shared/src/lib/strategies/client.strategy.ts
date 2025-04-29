import { ClientProxy } from '@nestjs/microservices';
import { Injectable, Inject } from '@nestjs/common';

export interface ClientStrategy {
  getClient(): ClientProxy;
}

@Injectable()
export class AuthClientStrategy implements ClientStrategy {
  constructor(@Inject('AUTH_SERVICE') private readonly client: ClientProxy) { }

  getClient(): ClientProxy {
    return this.client;
  }
}

@Injectable()
export class AdminClientStrategy implements ClientStrategy {
  constructor(@Inject('ADMIN_SERVICE') private readonly client: ClientProxy) { }

  getClient(): ClientProxy {
    return this.client;
  }
}

@Injectable()
export class UserClientStrategy implements ClientStrategy {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) { }

  getClient(): ClientProxy {
    return this.client;
  }
}

@Injectable()
export class OrderClientStrategy implements ClientStrategy {
  constructor(@Inject('ORDER_SERVICE') private readonly client: ClientProxy) { }

  getClient(): ClientProxy {
    return this.client;
  }
}

@Injectable()
export class InventoryClientStrategy implements ClientStrategy {
  constructor(@Inject('INVENTORY_SERVICE') private readonly client: ClientProxy) { }

  getClient(): ClientProxy {
    return this.client;
  }
}
