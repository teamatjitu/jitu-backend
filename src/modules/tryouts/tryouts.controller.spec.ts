import { Test, TestingModule } from '@nestjs/testing';
import { TryoutsController } from './tryouts.controller';
import { TryoutsService } from './tryouts.service';

const mockTryoutsService = {};

describe('TryoutsController', () => {
  let controller: TryoutsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TryoutsController],
      providers: [
        {
          provide: TryoutsService,
          useValue: mockTryoutsService,
        },
      ],
    }).compile();

    controller = module.get<TryoutsController>(TryoutsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
