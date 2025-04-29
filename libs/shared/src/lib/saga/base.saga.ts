import {Injectable} from '@nestjs/common';
import {SagaDefinition, SagaStep} from '../interfaces/saga.interface';
import {v4 as uuidv4} from 'uuid';
import {RedisService} from '../redis/redis.service';

interface SagaEvent<TData> {
  type: string;
  payload: TData;
  metadata: {
    sagaId: string;
    stepIndex: number;
    timestamp: number;
  };
}

interface SagaState<TData> {
  currentStep: number;
  data: TData;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

@Injectable()
export abstract class BaseSaga<TData> {
  protected constructor(
    protected readonly redisService: RedisService,
    protected readonly sagaName: string,
  ) {}

  protected async executeSaga(
    definition: SagaDefinition<TData>,
  ): Promise<TData> {
    const sagaId = uuidv4();
    const {steps, data} = definition;

    try {
      // Store saga state
      const initialState: SagaState<TData> = {
        currentStep: 0,
        data,
        status: 'RUNNING',
      };
      await this.storeSagaState(sagaId, initialState);

      // Execute steps
      let currentData = data;
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const event: SagaEvent<TData> = {
          type: `${this.sagaName}_STEP_${i}`,
          payload: currentData,
          metadata: {
            sagaId,
            stepIndex: i,
            timestamp: Date.now(),
          },
        };

        try {
          // Execute step
          const result = await step.execute(currentData);
          currentData = result;

          // Store step result
          await this.storeStepResult(sagaId, i, result);

          // Update saga state
          const newState: SagaState<TData> = {
            currentStep: i + 1,
            data: currentData,
            status: i === steps.length - 1 ? 'COMPLETED' : 'RUNNING',
          };
          await this.updateSagaState(sagaId, newState);

          // Store event
          await this.storeEvent(event);
        } catch (error) {
          // Handle step failure
          await this.handleStepFailure(sagaId, steps, i, currentData);
          throw error;
        }
      }

      return currentData;
    } catch (error) {
      // Update saga state to failed
      const failedState: SagaState<TData> = {
        currentStep: -1,
        data,
        status: 'FAILED',
        error: (error as Error).message,
      };
      await this.updateSagaState(sagaId, failedState);

      throw error;
    }
  }

  private async handleStepFailure(
    sagaId: string,
    steps: SagaStep<TData>[],
    failedStepIndex: number,
    data: TData,
  ): Promise<void> {
    // Store failure event
    const failureEvent: SagaEvent<TData> = {
      type: `${this.sagaName}_STEP_${failedStepIndex}_FAILED`,
      payload: data,
      metadata: {
        sagaId,
        stepIndex: failedStepIndex,
        timestamp: Date.now(),
      },
    };
    await this.storeEvent(failureEvent);

    // Compensate previous steps in reverse order
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = steps[i];
      try {
        await step.compensate(data);

        // Store compensation event
        const compensationEvent: SagaEvent<TData> = {
          type: `${this.sagaName}_STEP_${i}_COMPENSATED`,
          payload: data,
          metadata: {
            sagaId,
            stepIndex: i,
            timestamp: Date.now(),
          },
        };
        await this.storeEvent(compensationEvent);
      } catch (compensationError) {
        // Log compensation error but continue with other compensations
        console.error(`Compensation failed for step ${i}:`, compensationError);
      }
    }
  }

  private async storeSagaState(
    sagaId: string,
    state: SagaState<TData>,
  ): Promise<void> {
    await this.redisService.set(
      `saga:${this.sagaName}:${sagaId}`,
      JSON.stringify(state),
      24 * 60 * 60, // 24 hours expiry
    );
  }

  private async updateSagaState(
    sagaId: string,
    state: SagaState<TData>,
  ): Promise<void> {
    await this.storeSagaState(sagaId, state);
  }

  private async storeStepResult(
    sagaId: string,
    stepIndex: number,
    result: TData,
  ): Promise<void> {
    await this.redisService.set(
      `saga:${this.sagaName}:${sagaId}:step:${stepIndex}`,
      JSON.stringify(result),
      24 * 60 * 60, // 24 hours expiry
    );
  }

  private async storeEvent(event: SagaEvent<TData>): Promise<void> {
    await this.redisService.setList(
      `saga:${this.sagaName}:${event.metadata.sagaId}:events`,
      [JSON.stringify(event)],
    );
    await this.redisService.expire(
      `saga:${this.sagaName}:${event.metadata.sagaId}:events`,
      24 * 60 * 60, // 24 hours expiry
    );
  }

  protected async getSagaState(
    sagaId: string,
  ): Promise<SagaState<TData> | null> {
    const state = await this.redisService.get(
      `saga:${this.sagaName}:${sagaId}`,
    );
    return state ? JSON.parse(state) : null;
  }

  protected async getSagaEvents(sagaId: string): Promise<SagaEvent<TData>[]> {
    const events = await this.redisService.getList(
      `saga:${this.sagaName}:${sagaId}:events`,
    );
    return events.map(event => JSON.parse(event));
  }
}
