import {
  PrismaClient,
  SubtestName,
  TryoutBatch,
  TryoutStatus,
} from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- HELPERS ---

const SUBTEST_CONFIG = [
  { name: SubtestName.PU, duration: 30, questionCount: 10 },
  { name: SubtestName.PPU, duration: 25, questionCount: 10 },
  { name: SubtestName.PBM, duration: 25, questionCount: 10 },
  { name: SubtestName.PK, duration: 30, questionCount: 10 },
  { name: SubtestName.LBI, duration: 30, questionCount: 10 },
  { name: SubtestName.LBE, duration: 30, questionCount: 10 },
  { name: SubtestName.PM, duration: 30, questionCount: 10 },
];

function generateQuestions(subtestName: string, count: number) {
  return Array.from({ length: count }).map((_, i) => {
    const isOdd = i % 2 !== 0;
    return {
      type: 'MULTIPLE_CHOICE',
      content: `Soal nomor ${i + 1} untuk subtes ${subtestName}. Berapakah hasil dari ${i} + ${i}?`,
      points: 10,
      items: {
        create: [
          { content: `${i * 2}`, isCorrect: true, order: 1 }, // Jawaban Benar
          { content: `${i * 2 + 1}`, isCorrect: false, order: 2 },
          { content: `${i * 2 + 2}`, isCorrect: false, order: 3 },
          { content: `${i * 2 + 3}`, isCorrect: false, order: 4 },
          { content: `${i * 2 + 4}`, isCorrect: false, order: 5 },
        ],
      },
    };
  });
}

async function main() {
  console.log('🌱 Start seeding...');

  // 1. CLEANUP
  console.log('🧹 Cleaning up database...');
  await prisma.dailyQuestionLog.deleteMany();
  await prisma.userAnswer.deleteMany();
  await prisma.tryOutAttempt.deleteMany();
  await prisma.questionItem.deleteMany();
  await prisma.question.deleteMany();
  await prisma.subtest.deleteMany();
  await prisma.tryOut.deleteMany();
  await prisma.user.deleteMany();

  // 2. CREATE USERS
  console.log('👤 Creating users...');
  const user = await prisma.user.create({
    data: {
      id: 'user-test-01',
      name: 'Vazha Khayri',
      email: 'vazha@jitu.com',
      emailVerified: true,
      tokenBalance: 5000,
      target: 'Institut Teknologi Bandung',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
      currentStreak: 5,
      lastDailyDate: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'user-test-02',
      name: 'Tester Dua',
      email: 'tester2@jitu.com',
      emailVerified: true,
      tokenBalance: 0,
    },
  });

  // 3. CREATE TRYOUTS
  console.log('📝 Creating tryouts...');

  // Tryout 1: SNBT (Akan digunakan untuk History Score)
  const tryout1 = await prisma.tryOut.create({
    data: {
      title: 'Try Out UTBK SNBT 1',
      description: 'Simulasi UTBK SNBT lengkap dengan penilaian IRT.',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 0,
      code: 1,
      scheduledStart: new Date('2025-01-01T08:00:00Z'),
      subtests: {
        create: SUBTEST_CONFIG.map((conf, idx) => ({
          name: conf.name,
          durationMinutes: conf.duration,
          order: idx + 1,
          questions: {
            create: generateQuestions(conf.name, conf.questionCount),
          },
        })),
      },
    },
    include: {
      subtests: {
        include: { questions: { include: { items: true } } },
      },
    },
  });

  // Tryout 2: SNBT (Akan digunakan untuk Active Attempt)
  const tryout2 = await prisma.tryOut.create({
    data: {
      title: 'Try Out UTBK SNBT 2',
      description: 'Tryout kedua dengan tingkat kesulitan lebih tinggi.',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 0,
      code: 2,
      scheduledStart: new Date(), // Mulai hari ini
      subtests: {
        create: SUBTEST_CONFIG.map((conf, idx) => ({
          name: conf.name,
          durationMinutes: conf.duration,
          order: idx + 1,
          questions: {
            create: generateQuestions(conf.name, conf.questionCount),
          },
        })),
      },
    },
    include: {
      subtests: {
        include: { questions: { include: { items: true } } },
      },
    },
  });

  // Tryout 3: MANDIRI (Belum dikerjakan)
  await prisma.tryOut.create({
    data: {
      title: 'Simulasi Ujian Mandiri UGM',
      description: 'Persiapan khusus untuk UM UGM (UTUL).',
      batch: TryoutBatch.MANDIRI,
      isPublic: true,
      solutionPrice: 25000,
      code: 3,
      scheduledStart: new Date('2025-02-01T08:00:00Z'),
      subtests: {
        create: SUBTEST_CONFIG.slice(0, 4).map((conf, idx) => ({
          name: conf.name,
          durationMinutes: conf.duration,
          order: idx + 1,
          questions: {
            create: generateQuestions(conf.name, 5),
          },
        })),
      },
    },
  });

  // 4. SEED HISTORY (Finished Attempt)
  console.log('📚 Seeding history for Tryout 1...');

  // Hitung total score simulasi
  // Anggap user menjawab benar semua pertanyaan ganjil di setiap subtest
  let totalScore = 0;
  const userAnswersData: any[] = [];

  tryout1.subtests.forEach((subtest) => {
    subtest.questions.forEach((q, qIdx) => {
      // Jawab benar jika index genap (0, 2, 4...) -> soal 1, 3, 5...
      // Logic generateQuestions membuat soal odd (index genap) jawabannya item ke-0 (order 1)
      // generateQuestions:
      // i=0 (Soal 1) -> Correct Item index 0 (1 * 2 = 0)
      // i=1 (Soal 2) -> Correct Item index 0? No, let's check generateQuestions logic.
      // generateQuestions logic: items[0] is always correct (isCorrect: true).

      // Kita buat user menjawab benar untuk 70% soal
      const isCorrect = Math.random() > 0.3;
      const correctItem = q.items.find((i) => i.isCorrect);
      const wrongItem = q.items.find((i) => !i.isCorrect);

      const selectedItem = isCorrect ? correctItem : wrongItem;

      if (isCorrect) totalScore += q.points;

      if (selectedItem) {
        userAnswersData.push({
          questionId: q.id,
          questionItemId: selectedItem.id,
          isCorrect: isCorrect,
          tryOutAttemptId: 'attempt-history-01', // Placeholder, will be linked below
        });
      }
    });
  });

  await prisma.tryOutAttempt.create({
    data: {
      id: 'attempt-history-01',
      userId: user.id,
      tryOutId: tryout1.id,
      status: TryoutStatus.FINISHED,
      startedAt: new Date(new Date().setDate(new Date().getDate() - 1)), // Kemarin
      finishedAt: new Date(),
      totalScore: totalScore,
      answers: {
        createMany: {
          data: userAnswersData.map((a) => ({
            questionId: a.questionId,
            questionItemId: a.questionItemId,
            isCorrect: a.isCorrect,
          })),
        },
      },
    },
  });

  // 5. SEED ACTIVE ATTEMPT (In Progress)
  console.log('▶️ Seeding active attempt for Tryout 2...');

  // User baru mengerjakan sebagian soal di subtest pertama Tryout 2
  const activeAnswersData: any[] = [];
  const firstSubtestT2 = tryout2.subtests[0];

  // Jawab 3 soal pertama saja
  for (let i = 0; i < 3; i++) {
    const q = firstSubtestT2.questions[i];
    const correctItem = q.items.find((item) => item.isCorrect);
    if (correctItem) {
      activeAnswersData.push({
        questionId: q.id,
        questionItemId: correctItem.id,
        isCorrect: true,
      });
    }
  }

  await prisma.tryOutAttempt.create({
    data: {
      userId: user.id,
      tryOutId: tryout2.id,
      status: TryoutStatus.IN_PROGRESS,
      startedAt: new Date(), // Baru mulai
      totalScore: 0,
      answers: {
        createMany: {
          data: activeAnswersData,
        },
      },
    },
  });

  // 6. SEED DAILY QUESTION LOGS (Streak)
  console.log('🔥 Seeding daily streak...');

  // Buat log untuk 5 hari terakhir berturut-turut
  const today = new Date();
  // Kita ambil satu pertanyaan acak dari tryout1 untuk dijadikan "Daily Question" history
  const dailyQ = tryout1.subtests[0].questions[0];

  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i); // Hari ini, kemarin, dst.

    await prisma.dailyQuestionLog.create({
      data: {
        userId: user.id,
        questionId: dailyQ.id,
        isCorrect: true,
        completedAt: date,
      },
    });
  }

  console.log('\n--- DATA SEEDING SUMMARY ---');
  console.log(`User Principal: ${user.email} (Streak: ${user.currentStreak})`);
  console.log(`Tryout 1 (FINISHED): ID ${tryout1.id} - Score: ${totalScore}`);
  console.log(`Tryout 2 (IN_PROGRESS): ID ${tryout2.id}`);
  console.log(`Tryout 3 (NOT STARTED): Code 3`);
  console.log('----------------------------\n');

  console.log('✅ Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
