import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ClientStrategyFactory } from '@grocery-booking-api/shared';

@Injectable()
export class AppService {
  constructor(private readonly clientStrategyFactory: ClientStrategyFactory) { }

  private getClient(service: string): ClientProxy {
    try {
      const strategy = this.clientStrategyFactory.getStrategy(service);
      return strategy.getClient();
    } catch (error) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }
  }

  async forwardRequest<T>(
    service: string,
    pattern: string,
    data: any,
  ): Promise<T> {
    const client = this.getClient(service);
    console.log('forwardRequest', service, pattern, data, client);
    try {
      const response = await firstValueFrom(client.send(pattern, data));
      return response;
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async forwardEvent(
    service: string,
    pattern: string,
    data: any,
  ): Promise<void> {
    const client = this.getClient(service);
    try {
      client.emit(pattern, data);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
