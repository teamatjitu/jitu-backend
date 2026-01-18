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
  console.log('🌱 Memulai seeding database Jitu...');

  // =========================================================
  // 1. TOKEN PACKAGES (Menggunakan Upsert agar tidak duplikat)
  // =========================================================
  const packages = [
    { id: 'pkg-1', name: 'Paket Hemat', tokens: 20, price: 15000 },
    { id: 'pkg-2', name: 'Paket Populer', tokens: 50, price: 35000 },
    { id: 'pkg-3', name: 'Paket Sultan', tokens: 150, price: 100000 },
  ];

  for (const pkg of packages) {
    await prisma.tokenPackage.upsert({
      where: { id: pkg.id },
      update: { name: pkg.name, tokenAmount: pkg.tokens, price: pkg.price },
      create: {
        id: pkg.id,
        name: pkg.name,
        tokenAmount: pkg.tokens,
        price: pkg.price,
      },
    });
  }
  console.log('✅ Token packages seeded');

  // =========================================================
  // 2. USERS (Menggunakan Upsert berdasarkan Email)
  // =========================================================
  const userSiswa = await prisma.user.upsert({
    where: { email: 'siswa_test@example.com' },
    update: {},
    create: {
      id: 'user-siswa-test-id',
      name: 'Siswa Jitu',
      email: 'siswa_test@example.com',
      role: Role.USER,
      tokenBalance: 100, // Saldo awal untuk testing
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
      tokenBalance: 999,
      emailVerified: true,
    },
  });

  // User Khusus untuk Test Flow Pembayaran
  const userCoba = await prisma.user.upsert({
    where: { email: 'coba@example.com' },
    update: { tokenBalance: 100 }, // Reset saldo ke 100
    create: {
      id: 'user-coba-id',
      name: 'User Coba',
      email: 'coba@example.com',
      role: Role.USER,
      tokenBalance: 100,
      emailVerified: true,
    },
  });
  console.log('✅ Users seeded (termasuk User Coba)');

  // =========================================================
  // 3. HELPERS UNTUK SOAL (Mencegah bug "Kosong jadi Benar")
  // =========================================================
  const createMCQ = (
    content: string,
    correctIdx: number,
    explanation: string,
  ) => ({
    type: QuestionType.PILIHAN_GANDA,
    content,
    points: 10,
    explanation,
    items: {
      create: ['A', 'B', 'C', 'D', 'E'].map((l, i) => ({
        content: `Pilihan ${l}`,
        isCorrect: i === correctIdx, // Pastikan TEPAT SATU yang true
        order: i + 1,
      })),
    },
  });

  const createShort = (content: string, ans: string, expl: string) => ({
    type: QuestionType.ISIAN_SINGKAT,
    content,
    points: 10,
    correctAnswer: ans,
    explanation: expl,
  });

  // =========================================================
  // 4. TRYOUTS (Cek keberadaan sebelum create agar data lama aman)
  // =========================================================
  const TRYOUT_ID_PREMIUM = 'tryout-premium-snbt-4';

  const existingTryout = await prisma.tryOut.findUnique({
    where: { id: TRYOUT_ID_PREMIUM },
  });

  if (!existingTryout) {
    console.log('📝 Membuat Tryout baru dengan 7 Subtest...');
    await prisma.tryOut.create({
      data: {
        id: TRYOUT_ID_PREMIUM,
        title: 'Simulasi UTBK SNBT - Premium',
        description:
          'Tryout lengkap 7 subtest. Selesaikan pengerjaan untuk membuka pembahasan (50 Token).',
        batch: TryoutBatch.SNBT,
        isPublic: true,
        solutionPrice: 0,
        releaseDate: new Date(),
        scheduledStart: new Date(),
        scheduledEnd: new Date(
          new Date().getTime() + 365 * 24 * 60 * 60 * 1000,
        ),
        subtests: {
          create: [
            {
              name: SubtestName.PU,
              durationMinutes: 30,
              order: 1,
              questions: {
                create: [
                  createMCQ(
                    'Soal Penalaran Umum 1',
                    0,
                    'Analisis logika untuk pilihan A...',
                  ),
                ],
              },
            },
            {
              name: SubtestName.PPU,
              durationMinutes: 15,
              order: 2,
              questions: {
                create: [
                  createMCQ(
                    'Soal PPU 1',
                    1,
                    'Makna kata pada pilihan B adalah...',
                  ),
                ],
              },
            },
            {
              name: SubtestName.PBM,
              durationMinutes: 25,
              order: 3,
              questions: {
                create: [
                  createMCQ('Soal PBM 1', 2, 'Ejaan yang benar adalah C...'),
                ],
              },
            },
            {
              name: SubtestName.PK,
              durationMinutes: 20,
              order: 4,
              questions: {
                create: [
                  createShort(
                    'Hasil dari 15 + 25 adalah?',
                    '40',
                    'Penjumlahan dasar 15+25=40',
                  ),
                ],
              },
            },
            {
              name: SubtestName.LBI,
              durationMinutes: 45,
              order: 5,
              questions: {
                create: [
                  createMCQ(
                    'Soal Literasi Indonesia 1',
                    3,
                    'Ide pokok paragraf tersebut...',
                  ),
                ],
              },
            },
            {
              name: SubtestName.LBE,
              durationMinutes: 30,
              order: 6,
              questions: {
                create: [
                  createMCQ(
                    'English Literacy Question 1',
                    4,
                    'The main theme of the text...',
                  ),
                ],
              },
            },
            {
              name: SubtestName.PM,
              durationMinutes: 45,
              order: 7,
              questions: {
                create: [
                  createShort(
                    'Jika x=2, berapakah 3x + 4?',
                    '10',
                    'Substitusi: 3(2)+4 = 6+4 = 10',
                  ),
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✅ Tryout & 7 Subtests seeded');
  } else {
    console.log('⏩ Tryout sudah ada, melewati proses pembuatan.');
  }

  // =========================================================
  // 4b. PAID TRYOUT (Untuk testing Pendaftaran Berbayar)
  // =========================================================
  const TRYOUT_ID_PAID = 'tryout-paid-test-1';
  const existingPaidTryout = await prisma.tryOut.findUnique({
    where: { id: TRYOUT_ID_PAID },
  });

  if (!existingPaidTryout) {
    console.log('📝 Membuat Tryout Berbayar (20 Token)...');
    await prisma.tryOut.create({
      data: {
        id: TRYOUT_ID_PAID,
        title: 'Tryout Eksklusif UTBK #1',
        description:
          'Tryout berbayar untuk mengetes fitur pendaftaran & token.',
        batch: TryoutBatch.SNBT,
        isPublic: false,
        solutionPrice: 20, // Membutuhkan 20 token untuk daftar
        releaseDate: new Date(),
        scheduledStart: new Date(),
        scheduledEnd: new Date(
          new Date().getTime() + 365 * 24 * 60 * 60 * 1000,
        ),
        subtests: {
          create: [
            {
              name: SubtestName.PU,
              durationMinutes: 15,
              order: 1,
              questions: {
                create: [
                  createMCQ('Soal Berbayar 1', 0, 'Pembahasan eksklusif A...'),
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✅ Paid Tryout seeded');
  }

  // =========================================================
  // 4c. NEW PAID TRYOUT FOR USER COBA (25 Token)
  // =========================================================
  const TRYOUT_ID_PREMIUM_NEW = 'tryout-premium-new-1';
  const existingPremiumNew = await prisma.tryOut.findUnique({
    where: { id: TRYOUT_ID_PREMIUM_NEW },
  });

  if (!existingPremiumNew) {
    console.log('📝 Membuat Tryout Premium Baru (25 Token)...');
    await prisma.tryOut.create({
      data: {
        id: TRYOUT_ID_PREMIUM_NEW,
        title: 'Tryout Premium #1 (Coba Bayar)',
        description: 'Tryout khusus untuk simulasi pembayaran user coba.',
        batch: TryoutBatch.SNBT,
        isPublic: false,
        solutionPrice: 25, // Harga 25 Token
        releaseDate: new Date(),
        scheduledStart: new Date(),
        scheduledEnd: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // Aktif 30 hari
        subtests: {
          create: [
            {
              name: SubtestName.PU,
              durationMinutes: 10,
              order: 1,
              questions: {
                create: [
                  createMCQ('Soal Premium 1', 2, 'Pembahasan Premium...'),
                ],
              },
            },
          ],
        },
      },
    });
    console.log('✅ New Premium Tryout seeded');
  }

  // =========================================================
  // 5. PAYMENTS (Contoh untuk testing Dashboard)
  // =========================================================
  const existingPayment = await prisma.payment.findFirst({
    where: { userId: userSiswa.id },
  });

  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        userId: userSiswa.id,
        tokenPackageId: 'pkg-2',
        orderId: `ORDER-${Date.now()}`, // Add required unique orderId
        amount: 35000,
        tokenAmount: 50,
        status: PaymentStatus.CONFIRMED,
        paymentMethod: 'QRIS_STATIC',
      },
    });
    console.log('✅ Payment sample seeded');
  }

  console.log('🌱 Seeding selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  });
