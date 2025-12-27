import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Bersihkan Data Lama (Hati-hati, ini menghapus data!)
  await prisma.userAnswer.deleteMany();
  await prisma.tryOutAttempt.deleteMany();
  await prisma.questionItem.deleteMany();
  await prisma.question.deleteMany();
  await prisma.subtest.deleteMany();
  await prisma.tryOut.deleteMany();
  await prisma.user.deleteMany();

  // 2. Buat User Dummy
  const user = await prisma.user.create({
    data: {
      id: 'user-test-01',
      name: 'Tester Jitu',
      email: 'tester@jitu.com',
      emailVerified: true,
      tokenBalance: 1000,
    },
  });
  console.log(`👤 User created: ${user.id}`);

  // 3. Buat TryOut
  const tryout = await prisma.tryOut.create({
    data: {
      title: 'Try Out UTBK SNBT - Simulasi Postman',
      description: 'Tryout khusus untuk testing API backend',
      batch: 'SNBT',
      isPublic: true,
      solutionPrice: 0,
      code: 101,
      subtests: {
        create: [
          {
            name: 'Penalaran Umum',
            durationMinutes: 30,
            order: 1,
            questions: {
              create: [
                {
                  type: 'MULTIPLE_CHOICE',
                  content: 'Berapakah hasil dari 1 + 1?',
                  points: 10,
                  items: {
                    create: [
                      { content: '1', isCorrect: false, order: 1 },
                      { content: '2', isCorrect: true, order: 2 }, // Jawaban Benar
                      { content: '3', isCorrect: false, order: 3 },
                      { content: '4', isCorrect: false, order: 4 },
                      { content: '5', isCorrect: false, order: 5 },
                    ],
                  },
                },
                {
                  type: 'MULTIPLE_CHOICE',
                  content: 'Siapa presiden pertama Indonesia?',
                  points: 10,
                  items: {
                    create: [
                      { content: 'Soeharto', isCorrect: false, order: 1 },
                      { content: 'Habibie', isCorrect: false, order: 2 },
                      { content: 'Soekarno', isCorrect: true, order: 3 }, // Jawaban Benar
                      { content: 'Jokowi', isCorrect: false, order: 4 },
                      { content: 'Megawati', isCorrect: false, order: 5 },
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
          questions: {
            include: {
              items: true,
            },
          },
        },
      },
    },
  });

  console.log(`📝 TryOut created: ${tryout.id} (Code: ${tryout.code})`);

  // Log Data Penting untuk Postman
  const q1 = tryout.subtests[0].questions[0];
  const q1_ans = q1.items.find((i) => i.isCorrect); // Ambil jawaban benar

  console.log('\n--- DATA UNTUK POSTMAN ---');
  console.log(`TRYOUT ID (untuk Start Exam): ${tryout.id}`);
  console.log(`USER ID (untuk Body Start Exam): ${user.id}`);
  console.log(`QUESTION ID (untuk Save Answer): ${q1.id}`);
  console.log(`ANSWER ID (Pilihan Benar): ${q1_ans?.id}`);
  console.log('--------------------------\n');

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
