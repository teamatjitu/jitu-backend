import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma.service';
import { AdminAiService } from '../services/ai.service';

describe('AdminAiService', () => {
  const originalFetch = global.fetch;

  const createMocks = () => {
    const prisma = {
      tryOut: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    const tx = {
      question: {
        create: jest.fn(),
      },
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') return 'http://ai.local';
        if (key === 'AI_SERVICE_INTERNAL_API_KEY') return 'internal-key';
        return undefined;
      }),
    };

    return { prisma, tx, config };
  };

  const fullSubtests = [
    'PU',
    'PPU',
    'PBM',
    'PK',
    'LBI',
    'LBE',
    'PM',
  ].map((name) => ({
    id: `subtest-${name.toLowerCase()}`,
    name,
  }));

  beforeEach(() => {
    global.fetch = jest.fn() as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('requires a tryoutId when creating a batch', async () => {
    const { prisma, config } = createMocks();
    const service = new AdminAiService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );

    await expect(service.createBatch({})).rejects.toThrow(BadRequestException);
  });

  it('throws when the selected tryout does not exist', async () => {
    const { prisma, config } = createMocks();
    const service = new AdminAiService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
    prisma.tryOut.findUnique.mockResolvedValue(null);

    await expect(
      service.createBatch({ tryoutId: 'missing' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects tryouts that do not have the complete UTBK package subtests', async () => {
    const { prisma, config } = createMocks();
    const service = new AdminAiService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
    prisma.tryOut.findUnique.mockResolvedValue({
      id: 'tryout-1',
      title: 'Tryout Incomplete',
      subtests: [{ id: 'subtest-pu', name: 'PU' }],
    });

    await expect(
      service.createBatch({ tryoutId: 'tryout-1' }),
    ).rejects.toThrow('Tryout belum punya subtest paket UTBK lengkap');
  });

  it('creates a full UTBK package batch through the AI service', async () => {
    const { prisma, config } = createMocks();
    const service = new AdminAiService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
    prisma.tryOut.findUnique.mockResolvedValue({
      id: 'tryout-1',
      title: 'Simulasi UTBK',
      subtests: fullSubtests,
    });
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'batch-1',
          totalQuestions: 160,
          subtestName: 'FULL_UTBK',
        }),
        { status: 201 },
      ),
    );

    const result = await service.createBatch({
      tryoutId: 'tryout-1',
      difficulty: 'MEDIUM',
      questionTypes: ['PILIHAN_GANDA', 'ISIAN_SINGKAT'],
      includeImages: true,
      includeVideos: false,
    });
    const [, requestInit] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(requestInit.body);

    expect(result).toEqual({
      id: 'batch-1',
      totalQuestions: 160,
      subtestName: 'FULL_UTBK',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://ai.local/batches',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-internal-api-key': 'internal-key',
        }),
      }),
    );
    expect(body).toEqual(
      expect.objectContaining({
        title: 'Simulasi UTBK - Paket UTBK SNBT (160 Soal)',
        tryoutId: 'tryout-1',
        tryoutTitle: 'Simulasi UTBK',
        subtestId: 'subtest-pu',
        subtestName: 'FULL_UTBK',
        subject: 'Paket UTBK SNBT',
        topic: 'TPS dan Tes Literasi',
        totalQuestions: 160,
        includeImages: true,
        includeVideos: false,
        packageMode: 'UTBK_FULL_PACKAGE',
      }),
    );
    expect(body.subtestPlans).toHaveLength(7);
    expect(body.subtestPlans.map((plan: { totalQuestions: number }) => plan.totalQuestions))
      .toEqual([30, 20, 20, 20, 30, 20, 20]);
  });

  it('imports AI-published drafts into backend questions with asset URLs', async () => {
    const { prisma, tx, config } = createMocks();
    const service = new AdminAiService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(tx),
    );
    tx.question.create
      .mockResolvedValueOnce({ id: 'question-1' })
      .mockResolvedValueOnce({ id: 'question-2' });
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(
        JSON.stringify({
          alreadyPublished: false,
          publishedCount: 2,
          approvedDrafts: [
            {
              id: 'draft-1',
              subtestId: 'subtest-pu',
              type: 'PILIHAN_GANDA',
              content: '<p>Soal</p>',
              explanation: '<p>Bahas</p>',
              correctAnswer: 'A',
              points: 2,
              options: [
                { label: 'A', content: 'Benar', isCorrect: true, order: 1 },
                { label: 'B', content: 'Salah', isCorrect: false, order: 2 },
              ],
              assets: [
                {
                  kind: 'IMAGE',
                  secureUrl: 'https://cdn.test/image.png',
                },
                {
                  kind: 'VIDEO',
                  sourceUrl: 'https://cdn.test/video.mp4',
                },
              ],
            },
            {
              id: 'draft-2',
              subtestId: 'subtest-ppu',
              type: 'ISIAN_SINGKAT',
              content: '<p>Soal singkat</p>',
              explanation: '<p>Bahas singkat</p>',
              correctAnswer: 'jawaban',
              points: 2,
              options: [],
            },
          ],
        }),
        { status: 200 },
      ),
    );

    const result = await service.publishBatch('batch-1');

    expect(result.importedQuestions).toBe(2);
    expect(tx.question.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtestId: 'subtest-pu',
        type: 'PILIHAN_GANDA',
        imageUrl: 'https://cdn.test/image.png',
        narration: 'https://cdn.test/video.mp4',
        items: {
          create: [
            { content: 'Benar', isCorrect: true, order: 1 },
            { content: 'Salah', isCorrect: false, order: 2 },
          ],
        },
      }),
      include: { items: true },
    });
    expect(tx.question.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subtestId: 'subtest-ppu',
        type: 'ISIAN_SINGKAT',
        items: undefined,
      }),
      include: { items: true },
    });
  });

  it('surfaces missing AI service URL as service unavailable', async () => {
    const { prisma, config } = createMocks();
    config.get.mockImplementation((key: string) => {
      if (key === 'AI_SERVICE_INTERNAL_API_KEY') return 'internal-key';
      return undefined;
    });
    const service = new AdminAiService(
      config as unknown as ConfigService,
      prisma as unknown as PrismaService,
    );

    await expect(service.getBatches()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
