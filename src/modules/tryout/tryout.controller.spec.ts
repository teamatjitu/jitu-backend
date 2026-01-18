import { Test, TestingModule } from '@nestjs/testing';
import { TryoutController } from './tryout.controller';
import { TryoutService } from './tryout.service';
import { PrismaService } from 'src/prisma.service';

describe('TryoutController', () => {
  let controller: TryoutController;
  let service: TryoutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TryoutController],
      providers: [TryoutService],
    }).compile();

    service = module.get<TryoutService>(TryoutService);
    controller = module.get<TryoutController>(TryoutController);
  });

  describe('getAllTryouts', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });
});
