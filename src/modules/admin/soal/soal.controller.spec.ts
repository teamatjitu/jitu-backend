import { Test, TestingModule } from '@nestjs/testing';
import { SoalController } from './soal.controller';
import { SoalService } from './soal.service';

describe('SoalController', () => {
  let controller: SoalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SoalController],
      providers: [SoalService],
    }).compile();

    controller = module.get<SoalController>(SoalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
