import {
  PrismaClient,
  SubtestName,
  TryoutBatch,
  TryoutStatus,
  QuestionType,
} from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ===============================
  // TRYOUT 1
  // ===============================
  const tryout1 = await prisma.tryOut.create({
    data: {
      title: 'Tryout UTBK SNBT 1',
      description: 'Simulasi UTBK SNBT lengkap',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 10000,
      releaseDate: new Date('2025-01-01T00:00:00Z'),
      scheduledStart: new Date('2025-02-02T08:00:00Z'),
      scheduledEnd: new Date('2025-03-02T12:00:00Z'),

      subtests: {
        create: [
          {
            name: SubtestName.PU,
            durationMinutes: 60,
            order: 1,
            questions: {
              create: [
                {
                  type: QuestionType.PILIHAN_GANDA,
                  content: 'Manakah pernyataan yang benar?',
                  explanation: 'Jawaban A adalah yang paling tepat.',
                  points: 1,
                  items: {
                    create: [
                      { content: 'A', isCorrect: true, order: 1 },
                      { content: 'B', isCorrect: false, order: 2 },
                      { content: 'C', isCorrect: false, order: 3 },
                      { content: 'D', isCorrect: false, order: 4 },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: SubtestName.PBM,
            durationMinutes: 45,
            order: 2,
            questions: {
              create: [
                {
                  type: QuestionType.ISIAN_SINGKAT,
                  content: '2 + 2 = ?',
                  correctAnswer: '4',
                  points: 1,
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      subtests: {
        include: {
          questions: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  // ===============================
  // TRYOUT 2
  // ===============================
  const tryout2 = await prisma.tryOut.create({
    data: {
      title: 'Tryout UTBK SNBT 2',
      description: 'Tryout lanjutan dengan tingkat kesulitan sedang',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 15000,
      releaseDate: new Date('2025-02-01T00:00:00Z'),
      scheduledStart: new Date('2025-02-02T08:00:00Z'),
      scheduledEnd: new Date('2025-02-02T12:00:00Z'),

      subtests: {
        create: [
          {
            name: SubtestName.PPU,
            durationMinutes: 50,
            order: 1,
            questions: {
              create: [
                {
                  type: QuestionType.BENAR_SALAH,
                  content: 'Indonesia berada di Asia Tenggara.',
                  points: 1,
                  items: {
                    create: [
                      { content: 'Benar', isCorrect: true, order: 1 },
                      { content: 'Salah', isCorrect: false, order: 2 },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: {
      subtests: {
        include: {
          questions: true,
        },
      },
    },
  });

  // ===============================
  // DAILY QUESTION SAMPLE
  // ===============================
  const dailyQuestion = tryout1.subtests[0].questions[0];

  console.log('✅ Daily question seeded:', dailyQuestion.id);

  console.log('🌱 Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
