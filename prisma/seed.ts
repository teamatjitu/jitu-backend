import {
  PrismaClient,
  SubtestName,
  TryoutBatch,
  QuestionType,
  Role,
  PaymentStatus,
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
  // 1. CREATE TOKEN PACKAGES
  // ===============================
  const pkg1 = await prisma.tokenPackage.upsert({
    where: { id: 'pkg-1' },
    update: {},
    create: {
      id: 'pkg-1',
      name: 'Paket Hemat',
      tokenAmount: 20,
      price: 15000,
    },
  });

  const pkg2 = await prisma.tokenPackage.upsert({
    where: { id: 'pkg-2' },
    update: {},
    create: {
      id: 'pkg-2',
      name: 'Paket Populer',
      tokenAmount: 50,
      price: 35000,
    },
  });

  const pkg3 = await prisma.tokenPackage.upsert({
    where: { id: 'pkg-3' },
    update: {},
    create: {
      id: 'pkg-3',
      name: 'Paket Sultan',
      tokenAmount: 150,
      price: 100000,
    },
  });

  console.log('✅ Token packages seeded');

  // ===============================
  // 2. CREATE USERS
  // ===============================
  const userSiswa1 = await prisma.user.upsert({
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

  const userSiswa2 = await prisma.user.upsert({
    where: { email: 'siswa_2@example.com' },
    update: {},
    create: {
      id: 'user-siswa-2-id',
      name: 'Budi Santoso',
      email: 'siswa_2@example.com',
      role: Role.USER,
      tokenBalance: 0,
      emailVerified: true,
    },
  });

  const userSiswa3 = await prisma.user.upsert({
    where: { email: 'siswa_3@example.com' },
    update: {},
    create: {
      id: 'user-siswa-3-id',
      name: 'Ani Wijaya',
      email: 'siswa_3@example.com',
      role: Role.USER,
      tokenBalance: 10,
      emailVerified: true,
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

  console.log('✅ Users seeded');

  // ===============================
  // 3. CREATE PAYMENTS
  // ===============================
  // Note: userId is @unique in Payment schema, so 1 payment per user for now
  
  await prisma.payment.upsert({
    where: { userId: userSiswa1.id },
    update: {},
    create: {
      userId: userSiswa1.id,
      tokenPackageId: pkg2.id,
      amount: pkg2.price,
      tokenAmount: pkg2.tokenAmount,
      status: PaymentStatus.CONFIRMED,
      paymentMethod: 'QRIS_STATIC',
    },
  });

  await prisma.payment.upsert({
    where: { userId: userSiswa2.id },
    update: {},
    create: {
      userId: userSiswa2.id,
      tokenPackageId: pkg1.id,
      amount: pkg1.price,
      tokenAmount: pkg1.tokenAmount,
      status: PaymentStatus.PENDING,
      paymentMethod: 'MANUAL_TRANSFER',
    },
  });

  await prisma.payment.upsert({
    where: { userId: userSiswa3.id },
    update: {},
    create: {
      userId: userSiswa3.id,
      tokenPackageId: pkg3.id,
      amount: pkg3.price,
      tokenAmount: pkg3.tokenAmount,
      status: PaymentStatus.DECLINED,
      paymentMethod: 'QRIS_STATIC',
    },
  });

  console.log('✅ Payments seeded');

  // ===============================
  // 4. CREATE TRYOUTS & QUESTIONS
  // ===============================
  const tryout1 = await prisma.tryOut.upsert({
    where: { id: 'tryout-1' },
    update: {},
    create: {
      id: 'tryout-1',
      title: 'Tryout Simulasi Reset (In Progress)',
      description: 'Tryout ini sedang dikerjakan user untuk dites reset.',
      batch: TryoutBatch.SNBT,
      isPublic: true,
      solutionPrice: 0,
      releaseDate: new Date(),
      scheduledStart: new Date(),
      scheduledEnd: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
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
  });

  console.log('✅ Tryouts seeded');

  // ===============================
  // 5. CREATE ATTEMPTS
  // ===============================
  const existingAttempt = await prisma.tryOutAttempt.findFirst({
    where: { userId: userSiswa1.id, tryOutId: tryout1.id }
  });

  if (!existingAttempt) {
    await prisma.tryOutAttempt.create({
      data: {
        userId: userSiswa1.id,
        tryOutId: tryout1.id,
        status: 'IN_PROGRESS',
        totalScore: 0,
        startedAt: new Date(),
      },
    });
  }

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
