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
  question: {
    findUnique: jest.fn(),
  },

  userAnswer: {
    findMany: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
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
        where: { userId: 'user-1', tryOutId: 'tryout-1' },
        orderBy: { startedAt: 'desc' },
      });

      expect(result).toEqual(mockAttempt);
    });

    it('should throw if user has not registered the tryout', async () => {
      prismaMock.tryOutAttempt.findFirst.mockResolvedValue(null);

      await expect(service.startExam('tryout-1', 'user-1')).rejects.toThrow(
        'Anda belum terdaftar di tryout ini. Silakan daftar terlebih dahulu.',
      );
      expect(prismaMock.tryOutAttempt.create).not.toHaveBeenCalled();
    });

    it('should mark a registered NOT_STARTED attempt as IN_PROGRESS', async () => {
      const attempt = { id: 'attempt-2', status: 'NOT_STARTED' };
      const updatedAttempt = { ...attempt, status: 'IN_PROGRESS' };
      prismaMock.tryOutAttempt.findFirst.mockResolvedValue(attempt);
      prismaMock.tryOutAttempt.update.mockResolvedValue(updatedAttempt);

      const result = await service.startExam('tryout-1', 'user-1');

      expect(prismaMock.tryOutAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-2' },
        data: {
          status: 'IN_PROGRESS',
          startedAt: expect.any(Date),
          subtestStartedAt: expect.any(Date),
          currentSubtestOrder: 1,
        },
      });
      expect(result).toEqual(updatedAttempt);
    });
  });

  describe('saveAnswer', () => {
    beforeEach(() => {
      prismaMock.tryOutAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        status: 'IN_PROGRESS',
      });
    });

    it('should save selected item without grading immediately', async () => {
      prismaMock.questionItem.findUnique.mockResolvedValue({
        id: 'opt-B',
        isCorrect: true,
      });

      const mockSavedAnswer = { id: 'ans-1', isCorrect: false };

      prismaMock.userAnswer.upsert.mockResolvedValue(mockSavedAnswer);

      const result = await service.saveAnswer('attempt-1', 'q-1', 'opt-B');

      expect(prismaMock.userAnswer.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            isCorrect: false,
            questionItemId: 'opt-B',
          }),

          update: expect.objectContaining({
            questionItemId: 'opt-B',
          }),
        }),
      );

      expect(result.isCorrect).toBe(false);
    });

    it('should throw if attempt is already finished', async () => {
      prismaMock.tryOutAttempt.findUnique.mockResolvedValue({
        id: 'attempt-1',
        status: 'FINISHED',
      });

      await expect(
        service.saveAnswer('attempt-1', 'q-1', 'opt-A'),
      ).rejects.toThrow('Ujian sudah selesai, tidak bisa menyimpan jawaban.');
      expect(prismaMock.userAnswer.upsert).not.toHaveBeenCalled();
    });

    it('should throw error if question item invalid', async () => {
      prismaMock.questionItem.findUnique.mockResolvedValue(null);

      await expect(
        service.saveAnswer('attempt-1', 'q-1', 'invalid-opt'),
      ).rejects.toThrow('ID Pilihan jawaban tidak ditemukan: invalid-opt');
    });
  });

  describe('finishExam', () => {
    it('should grade all answers and update attempt status to FINISHED', async () => {
      const finishedAttempt = {
        id: 'attempt-1',
        status: 'FINISHED',
        totalScore: 2,
      };

      prismaMock.userAnswer.findMany.mockResolvedValue([
        {
          id: 'ans-1',
          questionId: 'q-1',
          questionItemId: 'opt-B',
          inputText: null,
          question: { points: 2 },
        },
        {
          id: 'ans-2',
          questionId: 'q-2',
          questionItemId: 'opt-A',
          inputText: null,
          question: { points: 2 },
        },
      ]);
      prismaMock.questionItem.findUnique
        .mockResolvedValueOnce({ isCorrect: true })
        .mockResolvedValueOnce({ isCorrect: false });

      prismaMock.tryOutAttempt.update.mockResolvedValue(finishedAttempt);

      const result = await service.finishExam('attempt-1');

      expect(prismaMock.userAnswer.findMany).toHaveBeenCalledWith({
        where: { tryOutAttemptId: 'attempt-1' },
        include: { question: true },
      });
      expect(prismaMock.userAnswer.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'ans-1' },
        data: { isCorrect: true },
      });
      expect(prismaMock.userAnswer.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'ans-2' },
        data: { isCorrect: false },
      });

      expect(prismaMock.tryOutAttempt.update).toHaveBeenCalledWith({
        where: { id: 'attempt-1' },

        data: {
          status: 'FINISHED',
          totalScore: 2,
          finishedAt: expect.any(Date),
        },
      });
      expect(result).toEqual(finishedAttempt);
    });
  });
});
