import {
  BadRequestException,
  BadGatewayException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma.service';
import { QuestionType, SubtestName } from 'generated/prisma/client';

interface AiDraftOption {
  label?: string;
  content?: string;
  isCorrect?: boolean;
  order?: number;
}

interface AiPublishedDraft {
  id: string;
  subtestId?: string;
  subtestName?: string;
  type: string;
  content?: string;
  explanation?: string;
  correctAnswer?: string;
  points?: number;
  options?: AiDraftOption[];
  assets?: {
    kind: 'IMAGE' | 'VIDEO';
    secureUrl?: string;
    sourceUrl?: string;
  }[];
}

interface AiPublishResponse {
  alreadyPublished?: boolean;
  publishedCount?: number;
  approvedDrafts?: AiPublishedDraft[];
  batch?: {
    subtestId?: string;
  };
}

interface UtbkPackagePlan {
  subtestName: SubtestName;
  subject: string;
  topic: string;
  totalQuestions: number;
  durationMinutes: number;
}

const FULL_UTBK_PACKAGE: UtbkPackagePlan[] = [
  {
    subtestName: SubtestName.PU,
    subject: 'Penalaran Umum',
    topic: 'Penalaran Induktif, Deduktif, dan Kuantitatif',
    totalQuestions: 30,
    durationMinutes: 30,
  },
  {
    subtestName: SubtestName.PPU,
    subject: 'Pengetahuan dan Pemahaman Umum',
    topic: 'Kemampuan berbahasa dan pemahaman logika dasar',
    totalQuestions: 20,
    durationMinutes: 15,
  },
  {
    subtestName: SubtestName.PBM,
    subject: 'Pemahaman Bacaan dan Menulis',
    topic: 'Analisis wacana dan tata bahasa',
    totalQuestions: 20,
    durationMinutes: 25,
  },
  {
    subtestName: SubtestName.PK,
    subject: 'Pengetahuan Kuantitatif',
    topic: 'Matematika dasar dan numerasi',
    totalQuestions: 20,
    durationMinutes: 20,
  },
  {
    subtestName: SubtestName.LBI,
    subject: 'Literasi dalam Bahasa Indonesia',
    topic: 'Memahami, menggunakan, dan menganalisis informasi bacaan',
    totalQuestions: 30,
    durationMinutes: 43,
  },
  {
    subtestName: SubtestName.LBE,
    subject: 'Literasi dalam Bahasa Inggris',
    topic: 'Reading comprehension and English literacy',
    totalQuestions: 20,
    durationMinutes: 30,
  },
  {
    subtestName: SubtestName.PM,
    subject: 'Penalaran Matematika',
    topic: 'Pemecahan masalah dan penalaran matematika',
    totalQuestions: 20,
    durationMinutes: 30,
  },
];

@Injectable()
export class AdminAiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  getStatus() {
    return this.request('/health/ready', { auth: false });
  }

  async createBatch(body: Record<string, unknown>) {
    const tryoutId = typeof body.tryoutId === 'string' ? body.tryoutId : null;

    if (!tryoutId) {
      throw new BadRequestException('tryoutId is required');
    }

    const tryout = await this.prisma.tryOut.findUnique({
      where: { id: tryoutId },
      include: { subtests: true },
    });

    if (!tryout) {
      throw new NotFoundException('Tryout not found');
    }

    const subtestsByName = new Map(
      tryout.subtests.map((subtest) => [subtest.name, subtest]),
    );
    const missingSubtests = FULL_UTBK_PACKAGE.filter(
      (plan) => !subtestsByName.has(plan.subtestName),
    ).map((plan) => plan.subtestName);

    if (missingSubtests.length > 0) {
      throw new BadRequestException(
        `Tryout belum punya subtest paket UTBK lengkap: ${missingSubtests.join(
          ', ',
        )}`,
      );
    }

    const subtestPlans = FULL_UTBK_PACKAGE.map((plan) => {
      const subtest = subtestsByName.get(plan.subtestName);

      return {
        subtestId: subtest?.id as string,
        subtestName: plan.subtestName,
        subject: plan.subject,
        topic: plan.topic,
        totalQuestions: plan.totalQuestions,
        durationMinutes: plan.durationMinutes,
      };
    });
    const totalQuestions = subtestPlans.reduce(
      (sum, plan) => sum + plan.totalQuestions,
      0,
    );

    return this.request('/batches', {
      method: 'POST',
      body: {
        ...body,
        title:
          typeof body.title === 'string' && body.title.trim().length > 0
            ? body.title
            : `${tryout.title} - Paket UTBK SNBT (${totalQuestions} Soal)`,
        tryoutId: tryout.id,
        tryoutTitle: tryout.title,
        subtestId: subtestPlans[0].subtestId,
        subtestName: 'FULL_UTBK',
        subject: 'Paket UTBK SNBT',
        topic: 'TPS dan Tes Literasi',
        totalQuestions,
        questionTypes:
          Array.isArray(body.questionTypes) && body.questionTypes.length > 0
            ? body.questionTypes
            : [QuestionType.PILIHAN_GANDA],
        includeImages: Boolean(body.includeImages),
        includeVideos: Boolean(body.includeVideos),
        videoStrategy: body.includeVideos ? body.videoStrategy : undefined,
        packageMode: 'UTBK_FULL_PACKAGE',
        subtestPlans,
      },
    });
  }

  getBatches() {
    return this.request('/batches');
  }

  getBatch(id: string) {
    return this.request(`/batches/${id}`);
  }

  startBatch(id: string) {
    return this.request(`/batches/${id}/start`, { method: 'POST' });
  }

  cancelBatch(id: string) {
    return this.request(`/batches/${id}/cancel`, { method: 'POST' });
  }

  getBatchDrafts(id: string) {
    return this.request(`/batches/${id}/drafts`);
  }

  getDraft(id: string) {
    return this.request(`/drafts/${id}`);
  }

  updateDraft(id: string, body: Record<string, unknown>) {
    return this.request(`/drafts/${id}`, { method: 'PATCH', body });
  }

  approveDraft(id: string) {
    return this.request(`/drafts/${id}/approve`, { method: 'POST' });
  }

  rejectDraft(id: string, body: Record<string, unknown>) {
    return this.request(`/drafts/${id}/reject`, { method: 'POST', body });
  }

  regenerateDraft(id: string, body: Record<string, unknown>) {
    return this.request(`/drafts/${id}/regenerate`, { method: 'POST', body });
  }

  generateDraftImage(id: string, body: Record<string, unknown>) {
    return this.request(`/drafts/${id}/assets/image`, { method: 'POST', body });
  }

  generateDraftVideo(id: string, body: Record<string, unknown>) {
    return this.request(`/drafts/${id}/assets/video`, { method: 'POST', body });
  }

  getBatchUsage(batchId: string) {
    return this.request(`/usage/batches/${batchId}`);
  }

  async publishBatch(batchId: string) {
    const publishResponse = await this.request<AiPublishResponse>(
      `/publish/batches/${batchId}`,
      { method: 'POST' },
    );

    if (
      publishResponse.alreadyPublished ||
      !publishResponse.approvedDrafts?.length
    ) {
      return {
        ...publishResponse,
        importedQuestions: 0,
      };
    }

    const createdQuestions = (await this.prisma.$transaction(
      async (tx): Promise<unknown[]> => {
        const questions: unknown[] = [];

        for (const draft of publishResponse.approvedDrafts || []) {
          const options = this.normalizeOptions(draft.options);

          const question = await tx.question.create({
            data: {
              subtestId:
                draft.subtestId ||
                publishResponse.batch?.subtestId ||
                this.extractSubtestIdFromDraft(draft),
              type: draft.type as QuestionType,
              content: draft.content,
              explanation: draft.explanation,
              correctAnswer: draft.correctAnswer,
              points: draft.points ?? 1,
              imageUrl: this.findAssetUrl(draft, 'IMAGE'),
              narration: this.findAssetUrl(draft, 'VIDEO'),
              items: options.length
                ? {
                    create: options.map((option) => ({
                      content: option.content,
                      isCorrect: option.isCorrect,
                      order: option.order,
                    })),
                  }
                : undefined,
            },
            include: {
              items: true,
            },
          });

          questions.push(question);
        }

        return questions;
      },
    )) as unknown[];

    return {
      ...publishResponse,
      importedQuestions: createdQuestions.length,
      questions: createdQuestions,
    };
  }

  private async request<T = unknown>(
    path: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: Record<string, unknown>;
      auth?: boolean;
    } = {},
  ): Promise<T> {
    const baseUrl = this.configService.get<string>('AI_SERVICE_URL');
    const apiKey = this.configService.get<string>(
      'AI_SERVICE_INTERNAL_API_KEY',
    );

    if (!baseUrl) {
      throw new ServiceUnavailableException('AI service URL is not configured');
    }

    if (options.auth !== false && !apiKey) {
      throw new ServiceUnavailableException(
        'AI service internal API key is not configured',
      );
    }

    try {
      const headers: Record<string, string> = {};

      if (options.body) {
        headers['Content-Type'] = 'application/json';
      }

      if (options.auth !== false) {
        headers['x-internal-api-key'] = apiKey as string;
      }

      const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const payload = await this.parseResponse(response);

      if (!response.ok) {
        const message =
          this.extractErrorMessage(payload) ||
          `AI service request failed with status ${response.status}`;
        throw new BadGatewayException(message);
      }

      return payload as T;
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;

      throw new ServiceUnavailableException(
        error instanceof Error
          ? `AI service unavailable: ${error.message}`
          : 'AI service unavailable',
      );
    }
  }

  private async parseResponse(response: Response) {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private extractErrorMessage(payload: unknown) {
    if (typeof payload === 'string') return payload;
    if (!payload || typeof payload !== 'object') return null;

    const message = (payload as { message?: unknown }).message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;

    return null;
  }

  private normalizeOptions(options?: AiDraftOption[]) {
    if (!Array.isArray(options)) return [];

    return options.map((option, index) => ({
      content: option.content || option.label || `Opsi ${index + 1}`,
      isCorrect: option.isCorrect ?? false,
      order: option.order ?? index + 1,
    }));
  }

  private findAssetUrl(draft: AiPublishedDraft, kind: 'IMAGE' | 'VIDEO') {
    const asset = draft.assets?.find((item) => item.kind === kind);
    return asset?.secureUrl || asset?.sourceUrl;
  }

  private extractSubtestIdFromDraft(draft: AiPublishedDraft) {
    if (!draft.subtestId) {
      throw new BadGatewayException(
        'AI publish response did not include subtestId',
      );
    }

    return draft.subtestId;
  }
}
