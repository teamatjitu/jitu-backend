import { Test, TestingModule } from '@nestjs/testing';
import { TryoutsService } from './tryouts.service';

describe('TryoutsService', () => {
  let service: TryoutsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TryoutsService],
    }).compile();

    service = module.get<TryoutsService>(TryoutsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
