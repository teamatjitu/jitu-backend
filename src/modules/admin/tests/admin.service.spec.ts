import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../services/admin.service';
import { PrismaService } from '../../../prisma.service';
import { CreateTryoutDto } from '../dto/create-tryout.dto';
import { UpdateTryoutDto } from '../dto/update-tryout.dto';
import { NotFoundException } from '@nestjs/common';

// Redefine enums locally to avoid Prisma client resolution issues in tests
enum TryoutBatch {
  SNBT = 'SNBT',
  MANDIRI = 'MANDIRI',
}

enum TryoutStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  // Mock Prisma Service
  const mockPrismaService = {
    tryOut: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics correctly', async () => {
      // Arrange
      mockPrismaService.tryOut.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5) // active
        .mockResolvedValueOnce(5); // upcoming

      // Act
      const result = await service.getDashboardStats();

      // Assert
      expect(result).toEqual({
        totalTryout: 10,
        totalActiveTryout: 5,
        totalUpcomingTryout: 5,
      });
      expect(prisma.tryOut.count).toHaveBeenCalledTimes(3);
    });
  });
});
