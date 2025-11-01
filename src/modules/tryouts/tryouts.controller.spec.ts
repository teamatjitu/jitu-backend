import { Test, TestingModule } from '@nestjs/testing';
import { TryoutsController } from './tryouts.controller';

describe('TryoutsController', () => {
  let controller: TryoutsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TryoutsController],
    }).compile();

    controller = module.get<TryoutsController>(TryoutsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
