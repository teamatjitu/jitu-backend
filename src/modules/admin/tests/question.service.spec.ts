import { Test, TestingModule } from '@nestjs/testing';
import { AdminQuestionService } from '../services/question.service';
import { PrismaService } from '../../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';

// Manually define enums to avoid Prisma client import issues in tests
enum QuestionType {
  PILIHAN_GANDA = 'PILIHAN_GANDA',
  ISIAN_SINGKAT = 'ISIAN_SINGKAT',
  BENAR_SALAH = 'BENAR_SALAH',
}

describe('AdminQuestionService', () => {
  let service: AdminQuestionService;
  let prisma: PrismaService;

  const mockPrismaService = {
    question: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    subtest: {
      findUnique: jest.fn(),
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
        AdminQuestionService,
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

    service = module.get<AdminQuestionService>(AdminQuestionService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuestion', () => {
    it('should create a question with nested items', async () => {
      const subtestId = 'subtest-1';
      const dto = {
        type: QuestionType.PILIHAN_GANDA as any,
        content: '<p>Soal 1</p>',
        explanation: 'Penjelasan',
        items: [
          { content: 'Opsi A', isCorrect: true, order: 0 },
          { content: 'Opsi B', isCorrect: false, order: 1 },
        ],
      };

      const mockCreatedQuestion = { id: 'q1', ...dto };
      mockPrismaService.question.create.mockResolvedValue(mockCreatedQuestion);

      const result = await service.createQuestion(dto as any, subtestId);

      expect(prisma.question.create).toHaveBeenCalledWith({
        data: {
          subtestId,
          type: dto.type,
          content: dto.content,
          explanation: dto.explanation,
          correctAnswer: undefined,
          items: {
            create: dto.items.map((item) => ({
              content: item.content,
              isCorrect: item.isCorrect,
              order: item.order,
            })),
          },
        },
        include: { items: true },
      });
      expect(result).toEqual(mockCreatedQuestion);
    });
  });

  describe('getQuestionBySubtestId', () => {
    it('should throw NotFoundException if subtest does not exist', async () => {
      mockPrismaService.subtest.findUnique.mockResolvedValue(null);
      await expect(service.getQuestionBySubtestId('invalid-s')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return questions if subtest exists', async () => {
      mockPrismaService.subtest.findUnique.mockResolvedValue({ id: 's1' });
      const mockQuestions = [{ id: 'q1', type: QuestionType.PILIHAN_GANDA }];
      mockPrismaService.question.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getQuestionBySubtestId('s1');

      expect(prisma.question.findMany).toHaveBeenCalledWith({
        where: { subtestId: 's1' },
        select: {
          id: true,
          type: true,
          imageUrl: true,
          content: true,
        },
      });
      expect(result).toEqual(mockQuestions);
    });
  });

  describe('updateQuestion', () => {
    it('should update a question and its items', async () => {
      const questionId = 'q1';
      const dto = {
        type: QuestionType.ISIAN_SINGKAT as any,
        content: 'Updated content',
        correctAnswer: 'Jawaban',
        items: [],
      };

      const mockUpdatedQuestion = { id: questionId, ...dto };
      mockPrismaService.question.update.mockResolvedValue(mockUpdatedQuestion);

      const result = await service.updateQuestion(dto as any, questionId);

      expect(prisma.question.update).toHaveBeenCalledWith({
        where: { id: questionId },
        data: {
          type: dto.type,
          content: dto.content,
          explanation: undefined,
          correctAnswer: dto.correctAnswer,
          items: {
            create: [],
          },
        },
        include: { items: true },
      });
      expect(result).toEqual(mockUpdatedQuestion);
    });
  });

  describe('deleteQuestion', () => {
    it('should delete a question', async () => {
      mockPrismaService.question.delete.mockResolvedValue({ id: 'q1' });
      await service.deleteQuestion('q1');
      expect(prisma.question.delete).toHaveBeenCalledWith({
        where: { id: 'q1' },
      });
    });
  });
});
