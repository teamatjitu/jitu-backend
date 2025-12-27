import { Test, TestingModule } from '@nestjs/testing';
import { TryoutService } from './tryout.service';
import { PrismaService } from '../../prisma.service';

const prismaMock = {
  tryOut: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('TryoutService', () => {
  let service: TryoutService;

  const mockTryoutsComplete = [
    {
      id: 'cku1tryout1',
      code: 1,
      title: 'Try Out UTBK SNBT 1',
      batch: 'SNBT',
      description: 'Simulasi UTBK SNBT lengkap',
      solutionPrice: 0,
      isPublic: true,
      referralCode: null,
      scheduledStart: new Date('2025-01-10T08:00:00Z'),
      createdAt: new Date(),
      subtests: [
        {
          order: 1,
          name: 'Penalaran Umum',
          durationMinutes: 30,
          questions: [{}, {}, {}], // 3 questions
        },
        {
          order: 2,
          name: 'Pengetahuan Kuantitatif',
          durationMinutes: 45,
          questions: [{}, {}], // 2 questions
        },
      ],
      attempts: [],
      unlockedSolutions: [],
      _count: {
        attempts: 10,
      },
    },
    {
      id: 'cku1tryout2',
      code: 2,
      title: 'Try Out UTBK SNBT 2',
      batch: 'SNBT',
      description: 'Try out lanjutan',
      solutionPrice: 30000,
      isPublic: true,
      referralCode: null,
      scheduledStart: new Date('2025-01-17T08:00:00Z'),
      createdAt: new Date(),
      subtests: [],
      attempts: [],
      unlockedSolutions: [],
      _count: {
        attempts: 5,
      },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TryoutService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<TryoutService>(TryoutService);

    prismaMock.tryOut.findMany.mockClear();
    prismaMock.tryOut.findUnique.mockClear();
  });

  describe('getTryouts', () => {
    it('should return mapped tryouts with correct format', async () => {
      prismaMock.tryOut.findMany.mockResolvedValue(mockTryoutsComplete);

      const result = await service.getTryouts();

      expect(prismaMock.tryOut.findMany).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);

      // Verifikasi Item 1
      expect(result[0]).toEqual({
        id: 'cku1tryout1', // Sekarang string CUID
        title: 'Try Out UTBK SNBT 1',
        number: '1',
        canEdit: false,
        participants: 10, // Mengambil dari _count.attempts
        badge: 'SNBT',
      });

      // Verifikasi Item 2
      expect(result[1]).toEqual({
        id: 'cku1tryout2', // Sekarang string CUID
        title: 'Try Out UTBK SNBT 2',
        number: '2',
        canEdit: false,
        participants: 5,
        badge: 'SNBT',
      });
    });
  });

  describe('getTryoutById', () => {
    it('should return detailed tryout DTO', async () => {
      // Ambil item pertama dari array mock sebagai target test
      const targetTryout = mockTryoutsComplete[0];
      prismaMock.tryOut.findUnique.mockResolvedValue(targetTryout);

      const result = await service.getTryoutById('cku1tryout1', 'user123');

      expect(prismaMock.tryOut.findUnique).toHaveBeenCalledWith({
        where: { id: 'cku1tryout1' },
        include: {
          subtests: {
            include: {
              questions: true,
            },
          },
          attempts: { where: { userId: 'user123' } },
          unlockedSolutions: { where: { userId: 'user123' } },
        },
      });

      expect(result).toEqual({
        id: 'cku1tryout1', // CUID
        title: 'Try Out UTBK SNBT 1',
        number: 1,
        badge: 'SNBT',
        participants: 0,
        description: 'Simulasi UTBK SNBT lengkap',
        duration: 75,
        totalQuestions: 5,
        startDate: targetTryout.scheduledStart.toISOString(),
        endDate: '',
        isRegistered: false,
        isFree: true,
        tokenCost: 0,
        categories: [
          {
            id: 1,
            name: 'Penalaran Umum',
            questionCount: 3,
            duration: 30,
            isCompleted: false,
          },
          {
            id: 2,
            name: 'Pengetahuan Kuantitatif',
            questionCount: 2,
            duration: 45,
            isCompleted: false,
          },
        ],
        benefits: expect.any(Array),
        requirements: expect.any(Array),
      });
    });
  });
});
