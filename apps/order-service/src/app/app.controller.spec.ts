import {Test, TestingModule} from '@nestjs/testing';
import {AppController} from './app.controller';
import {AppService} from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getData', () => {
    it('should return "Hello API"', () => {
      expect(appController.getData()).toEqual({message: 'Hello API'});
    });
  });
});
