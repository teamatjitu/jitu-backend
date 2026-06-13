import { Test, TestingModule } from '@nestjs/testing';
import { TryoutController } from './tryout.controller';
import { TryoutService } from './tryout.service';

describe('TryoutController', () => {
  let controller: TryoutController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TryoutController],
      providers: [{ provide: TryoutService, useValue: {} }],
    }).compile();

    controller = module.get<TryoutController>(TryoutController);
  });

  describe('getAllTryouts', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
