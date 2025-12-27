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

  questionItem: {
    findUnique: jest.fn(),
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
        where: {
          userId: 'user-1',
          tryOutId: 'tryout-1',
          status: 'IN_PROGRESS',
        },
      });

      expect(result).toEqual(mockAttempt);
    });

    it('should create new attempt if not found', async () => {
      prismaMock.tryOutAttempt.findFirst.mockResolvedValue(null);

      const newAttempt = { id: 'attempt-2', status: 'IN_PROGRESS' };

      prismaMock.tryOutAttempt.create.mockResolvedValue(newAttempt);

      const result = await service.startExam('tryout-1', 'user-1');

      expect(prismaMock.tryOutAttempt.create).toHaveBeenCalled();

      expect(result).toEqual(newAttempt);
    });
  });

  describe('saveAnswer', () => {
    it('should mark answer as CORRECT if selected item is correct', async () => {
      prismaMock.questionItem.findUnique.mockResolvedValue({
        id: 'opt-B',

        isCorrect: true, // Jawaban Benar
      });

      const mockSavedAnswer = { id: 'ans-1', isCorrect: true };

      prismaMock.userAnswer.upsert.mockResolvedValue(mockSavedAnswer);

      const result = await service.saveAnswer('attempt-1', 'q-1', 'opt-B');

      expect(prismaMock.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isCorrect: true,

            questionItemId: 'opt-B',
          }),

          update: expect.objectContaining({
            isCorrect: true,

            questionItemId: 'opt-B',
          }),
        }),
      );

      expect(result.isCorrect).toBe(true);
    });

    it('should mark answer as INCORRECT if selected item is wrong', async () => {
      prismaMock.questionItem.findUnique.mockResolvedValue({
        id: 'opt-A',

        isCorrect: false, // Jawaban Salah
      });

      const mockSavedAnswer = { id: 'ans-1', isCorrect: false };

      prismaMock.userAnswer.upsert.mockResolvedValue(mockSavedAnswer);

      await service.saveAnswer('attempt-1', 'q-1', 'opt-A');

      expect(prismaMock.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isCorrect: false }),

          update: expect.objectContaining({ isCorrect: false }),
        }),
      );
    });

    it('should throw error if question item invalid', async () => {
      prismaMock.questionItem.findUnique.mockResolvedValue(null);

      await expect(
        service.saveAnswer('attempt-1', 'q-1', 'invalid-opt'),
      ).rejects.toThrow('Pilihan jawaban tidak valid');
    });
  });

  describe('finishExam', () => {
    it('should update attempt status to FINISHED', async () => {
      const finishedAttempt = { id: 'attempt-1', status: 'FINISHED' };

      prismaMock.tryOutAttempt.update.mockResolvedValue(finishedAttempt);

      await service.finishExam('attempt-1');

      expect(prismaMock.tryOutAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },

        data: {
          status: 'FINISHED',

          finishedAt: expect.any(Date),
        },
      });
    });
  });
});
