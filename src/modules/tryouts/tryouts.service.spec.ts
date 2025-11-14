import { Test, TestingModule } from '@nestjs/testing';
import { TryoutsService } from './tryouts.service';
import { PrismaService } from '@/prisma.service';
import { PaginationDto } from './dto/pagination.dto';

const mockPrismaService = {
  tryoutAttempt: {
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

describe('TryoutsService', () => {
  let service: TryoutsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TryoutsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TryoutsService>(TryoutsService);
    prisma = module.get<PrismaService, typeof mockPrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getLeaderboard', () => {
    it('should return a paginated and ranked leaderboard', async () => {
      const tryoutId = 'tryout-1';
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const mockAttempts = [
        {
          id: 'attempt-1',
          userId: 'user-1',
          scaledScore: 800,
          createdAt: new Date(),
          user: { name: 'User Peringkat 1', image: null },
        },
        {
          id: 'attempt-2',
          userId: 'user-2',
          scaledScore: 750,
          createdAt: new Date(),
          user: { name: 'User Peringkat 2', image: null },
        },
      ];

      prisma.tryoutAttempt.count.mockResolvedValue(2);
      prisma.tryoutAttempt.findMany.mockResolvedValue(mockAttempts);

      const result = await service.getLeaderboard(tryoutId, paginationDto);

      expect(result.data.length).toBe(2);
      expect(result.currentPage).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].userName).toBe('User Peringkat 1');
      expect(result.data[0].score).toBe(800);
      expect(result.data[1].rank).toBe(2);

      expect(prisma.tryoutAttempt.findMany).toHaveBeenCalledWith({
        where: { tryoutId: tryoutId, isFinished: true },
        include: {
          user: { select: { name: true, image: true } },
        },
        orderBy: [{ scaledScore: 'desc' }, { createdAt: 'asc' }],
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getTryoutHistory', () => {
    it('should return paginated history for a user', async () => {
      const userId = 'user-1';
      const paginationDto: PaginationDto = { page: 1, limit: 10 };

      const mockHistory = [
        {
          id: 'attempt-1',
          tryout: { name: 'Tryout Dummy 1', year: 2025 },
          createdAt: new Date(),
          rawScore: 1,
          scaledScore: 800,
          isFinished: true,
        },
      ];

      prisma.tryoutAttempt.count.mockResolvedValue(1);
      prisma.tryoutAttempt.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getTryoutHistory(userId, paginationDto);

      expect(result.data.length).toBe(1);
      expect(result.currentPage).toBe(1);
      expect(result.data[0].tryoutName).toBe('Tryout Dummy 1');
      expect(result.data[0].scaledScore).toBe(800);
    });
  });
});
