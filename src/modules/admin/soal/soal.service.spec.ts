import { Test, TestingModule } from '@nestjs/testing';
import { SoalService } from './soal.service';

describe('SoalService', () => {
  let service: SoalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SoalService],
    }).compile();

    service = module.get<SoalService>(SoalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
