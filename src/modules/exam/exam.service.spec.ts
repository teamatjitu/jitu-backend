import { Test, TestingModule } from '@nestjs/testing';
import { ExamService } from './exam.service';
import { PrismaService } from '../../prisma.service';

const prismaMock = {
  tryOutAttempt: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userAnswer: {
    upsert: jest.fn(),
  },
};

describe('ExamService', () => {
  let service: ExamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ExamService>(ExamService);
    jest.clearAllMocks();
  });

  describe('startExam', () => {
    it('should resume existing attempt if found', async () => {
      const mockAttempt = { id: 'attempt-1', status: 'IN_PROGRESS' };
      prismaMock.tryOutAttempt.findFirst.mockResolvedValue(mockAttempt);

      const result = await service.startExam('tryout-1', 'user-1');

      expect(prismaMock.tryOutAttempt.findFirst).toHaveBeenCalledWith({
        where: { userId: 'user-1', tryOutId: 'tryout-1', status: 'IN_PROGRESS' },
      });
      expect(prismaMock.tryOutAttempt.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockAttempt);
    });

    it('should create new attempt if not found', async () => {
      prismaMock.tryOutAttempt.findFirst.mockResolvedValue(null);
      const newAttempt = { id: 'attempt-2', status: 'IN_PROGRESS' };
      prismaMock.tryOutAttempt.create.mockResolvedValue(newAttempt);

      const result = await service.startExam('tryout-1', 'user-1');

      expect(prismaMock.tryOutAttempt.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          tryOutId: 'tryout-1',
          status: 'IN_PROGRESS',
          totalScore: 0,
          startedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(newAttempt);
    });
  });

  describe('saveAnswer', () => {
    it('should upsert user answer', async () => {
      const mockAnswer = { id: 'ans-1', questionId: 'q-1', questionItemId: 'opt-A' };
      prismaMock.userAnswer.upsert.mockResolvedValue(mockAnswer);

      const result = await service.saveAnswer('attempt-1', 'q-1', 'opt-A');

      expect(prismaMock.userAnswer.upsert).toHaveBeenCalledWith({
        where: {
          tryOutAttemptId_questionId: {
            tryOutAttemptId: 'attempt-1',
            questionId: 'q-1',
          },
        },
        update: {
          questionItemId: 'opt-A',
          updatedAt: expect.any(Date),
        },
        create: {
          tryOutAttemptId: 'attempt-1',
          questionId: 'q-1',
          questionItemId: 'opt-A',
        },
      });
      expect(result).toEqual(mockAnswer);
    });
  });

  describe('finishExam', () => {
    it('should update attempt status to FINISHED', async () => {
      const finishedAttempt = { id: 'attempt-1', status: 'FINISHED' };
      prismaMock.tryOutAttempt.update.mockResolvedValue(finishedAttempt);

      const result = await service.finishExam('attempt-1');

      expect(prismaMock.tryOutAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },
        data: {
          status: 'FINISHED',
          finishedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(finishedAttempt);
    });
  });
});