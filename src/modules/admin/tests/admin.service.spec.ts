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
    },
    user: {
      count: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
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
        .mockResolvedValueOnce(3) // upcoming
        .mockResolvedValueOnce(2); // ended
      mockPrismaService.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(80)
        .mockResolvedValueOnce(4);
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: 250000 },
      });
      mockPrismaService.payment.count.mockResolvedValue(7);
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Act
      const result = await service.getDashboardStats();

      // Assert
      expect(result).toEqual(expect.objectContaining({
        totalTryout: 10,
        totalActiveTryout: 5,
        totalUpcomingTryout: 3,
        totalEndedTryout: 2,
        totalUser: 100,
        activeUser: 80,
        totalAdmin: 4,
        totalRevenue: 250000,
        totalPendingPayment: 7,
      }));
      expect(result.charts.revenue).toHaveLength(6);
      expect(result.charts.userGrowth).toHaveLength(6);
      expect(result.charts.weeklyActivity).toHaveLength(7);
      expect(prisma.tryOut.count).toHaveBeenCalledTimes(4);
      expect(prisma.user.count).toHaveBeenCalledTimes(3);
      expect(prisma.payment.aggregate).toHaveBeenCalledTimes(1);
      expect(prisma.payment.count).toHaveBeenCalledTimes(1);
    });
  });
});
