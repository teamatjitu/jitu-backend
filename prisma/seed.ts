import {
  PrismaClient,
  SubtestName,
  TryoutBatch,
  QuestionType,
  Role,
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
  // 1. CLEANUP (Optional - be careful in prod)
  // ===============================
  // await prisma.tryOutAttempt.deleteMany();
  // await prisma.tokenTransaction.deleteMany();
  // await prisma.user.deleteMany({ where: { email: { contains: 'test' } } });

  // ===============================
  // 2. CREATE USERS
  // ===============================
  const userSiswa = await prisma.user.upsert({
    where: { email: 'siswa_test@example.com' },
    update: {},
    create: {
      id: 'user-siswa-test-id',
      name: 'Siswa Teladan',
      email: 'siswa_test@example.com',
      role: Role.USER,
      tokenBalance: 50,
      emailVerified: true,
      target: 'ITB - Teknik Informatika',
    },
  });

  const userAdmin = await prisma.user.upsert({
    where: { email: 'admin_test@example.com' },
    update: { role: Role.ADMIN },
    create: {
      id: 'user-admin-test-id',
      name: 'Admin Jitu',
      email: 'admin_test@example.com',
      role: Role.ADMIN,
      tokenBalance: 9999,
      emailVerified: true,
    },
  });

  console.log('✅ Users seeded:', userSiswa.name, userAdmin.name);

  // ===============================
  // 3. CREATE TOKEN TRANSACTIONS
  // ===============================
  await prisma.tokenTransaction.createMany({
    data: [
      {
        userId: userSiswa.id,
        amount: 100,
        type: 'TOPUP',
        referenceId: 'ORDER-001',
      },
      {
        userId: userSiswa.id,
        amount: -50,
        type: 'PURCHASE',
        referenceId: 'TO-BUNDLE-A',
      },
    ],
  });
  console.log('✅ Token transactions seeded');

  // ===============================
  // 4. CREATE TRYOUTS & QUESTIONS
  // ===============================
  const tryout1 = await prisma.tryOut.create({
    data: {
      title: 'Tryout Simulasi Reset (In Progress)',
      description: 'Tryout ini sedang dikerjakan user untuk dites reset.',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 0,
      releaseDate: new Date(),
      scheduledStart: new Date(),
      scheduledEnd: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
      status: 'IN_PROGRESS',
      subtests: {
        create: [
          {
            name: SubtestName.PU,
            durationMinutes: 30,
            order: 1,
            questions: {
              create: [
                {
                  type: QuestionType.PILIHAN_GANDA,
                  content: '1 + 1 = ?',
                  points: 10,
                  items: {
                    create: [
                      { content: '2', isCorrect: true, order: 1 },
                      { content: '3', isCorrect: false, order: 2 },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    include: { subtests: { include: { questions: true } } },
  });

  const tryout2 = await prisma.tryOut.create({
    data: {
      title: 'Tryout Selesai (Finished)',
      description: 'Tryout ini sudah selesai dikerjakan.',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 0,
      releaseDate: new Date(),
      scheduledStart: new Date(),
      scheduledEnd: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
    },
  });

  console.log('✅ Tryouts seeded');

  // ===============================
  // 5. CREATE ATTEMPTS (PENGERJAAN)
  // ===============================
  
  // Attempt 1: IN_PROGRESS (Untuk di-reset)
  await prisma.tryOutAttempt.create({
    data: {
      userId: userSiswa.id,
      tryOutId: tryout1.id,
      status: 'IN_PROGRESS',
      totalScore: 0,
      startedAt: new Date(),
      answers: {
        create: {
          questionId: tryout1.subtests[0].questions[0].id,
          isCorrect: true,
          inputText: '2',
        },
      },
    },
  });

  // Attempt 2: FINISHED (History)
  await prisma.tryOutAttempt.create({
    data: {
      userId: userSiswa.id,
      tryOutId: tryout2.id,
      status: 'FINISHED',
      totalScore: 850,
      startedAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      finishedAt: new Date(new Date().getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
  });

  console.log('✅ User attempts seeded');
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