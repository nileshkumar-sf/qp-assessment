import {Injectable} from '@nestjs/common';
import {ClientStrategy} from './client.strategy';
import {AuthClientStrategy} from './client.strategy';
import {AdminClientStrategy} from './client.strategy';
import {UserClientStrategy} from './client.strategy';
import {OrderClientStrategy} from './client.strategy';
import {InventoryClientStrategy} from './client.strategy';

@Injectable()
export class ClientStrategyFactory {
  private strategies: Map<string, ClientStrategy>;

  constructor(
    private readonly authStrategy: AuthClientStrategy,
    private readonly adminStrategy: AdminClientStrategy,
    private readonly userStrategy: UserClientStrategy,
    private readonly orderStrategy: OrderClientStrategy,
    private readonly inventoryStrategy: InventoryClientStrategy,
  ) {
    this.strategies = new Map<string, ClientStrategy>([
      ['auth', this.authStrategy],
      ['admin', this.adminStrategy],
      ['user', this.userStrategy],
      ['order', this.orderStrategy],
      ['inventory', this.inventoryStrategy],
    ]);
  }

  getStrategy(service: string): ClientStrategy {
    const strategy = this.strategies.get(service);
    if (!strategy) {
      throw new Error(`No strategy found for service: ${service}`);
    }
    return strategy;
  }
}
