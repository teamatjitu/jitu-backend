import { Test, TestingModule } from '@nestjs/testing';
import { AdminSubtestService } from '../services/subtest.service';
import { PrismaService } from '../../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

enum SubtestName {
  PU = 'PU',
  PPU = 'PPU',
  PBM = 'PBM',
  PK = 'PK',
  LBI = 'LBI',
  LBE = 'LBE',
  PM = 'PM',
}

// test save

describe('AdminSubtestService', () => {
  let service: AdminSubtestService;
  let prisma: PrismaService;

  const mockPrismaService = {
    tryOut: {
      findUnique: jest.fn(),
    },
    subtest: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'CLOUDINARY_NAME') return 'test-cloud';
      if (key === 'CLOUDINARY_API_KEY') return 'test-key';
      if (key === 'CLOUDINARY_API_SECRET') return 'test-secret';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminSubtestService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AdminSubtestService>(AdminSubtestService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUtbkSubtests', () => {
    it('should create 7 UTBK subtests', async () => {
      mockPrismaService.subtest.createMany.mockResolvedValue({ count: 7 });

      const result = await service.createUtbkSubtests('tryout-1');

      expect(prisma.subtest.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: SubtestName.PU, order: 1 }),
          expect.objectContaining({ name: SubtestName.PM, order: 7 }),
        ]),
      });
      expect(result).toEqual({ count: 7 });
    });
  });

  describe('createSubtest', () => {
    it('should throw NotFoundException if tryout does not exist', async () => {
      mockPrismaService.tryOut.findUnique.mockResolvedValue(null);

      await expect(
        service.createSubtest({
          tryoutId: 'invalid-id',
          name: SubtestName.PU as any,
          durationMinutes: 30,
          order: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a subtest if tryout exists', async () => {
      mockPrismaService.tryOut.findUnique.mockResolvedValue({ id: 'tryout-1' });
      mockPrismaService.subtest.create.mockResolvedValue({ id: 'subtest-1' });

      const dto = {
        tryoutId: 'tryout-1',
        name: SubtestName.PU as any,
        durationMinutes: 30,
        order: 1,
      };

      const result = await service.createSubtest(dto);

      expect(prisma.subtest.create).toHaveBeenCalledWith({
        data: {
          tryOutId: dto.tryoutId,
          name: dto.name,
          durationMinutes: dto.durationMinutes,
          order: dto.order,
        },
      });
      expect(result).toEqual({ id: 'subtest-1' });
    });
  });

  describe('getSubtestsByTryoutId', () => {
    it('should return all subtests for a tryout', async () => {
      mockPrismaService.tryOut.findUnique.mockResolvedValue({ id: 'tryout-1' });
      const mockSubtests = [{ id: 's1' }, { id: 's2' }];
      mockPrismaService.subtest.findMany.mockResolvedValue(mockSubtests);

      const result = await service.getSubtestsByTryoutId('tryout-1');

      expect(prisma.subtest.findMany).toHaveBeenCalledWith({
        where: { tryOutId: 'tryout-1' },
        orderBy: { order: 'asc' },
      });
      expect(result).toEqual(mockSubtests);
    });
  });

  describe('deleteSubtest', () => {
    it('should delete a subtest if it exists', async () => {
      mockPrismaService.subtest.findUnique.mockResolvedValue({ id: 's1' });
      mockPrismaService.subtest.delete.mockResolvedValue({ id: 's1' });

      await service.deleteSubtest('s1');

      expect(prisma.subtest.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      });
    });

    it('should throw NotFoundException if subtest not found', async () => {
      mockPrismaService.subtest.findUnique.mockResolvedValue(null);
      await expect(service.deleteSubtest('s1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
