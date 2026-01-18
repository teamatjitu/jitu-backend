import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';

// Untuk sekarang, tipe token yang dibeli hard-coded
const TOKEN_TYPES = {
  1: { amount: 10, price: 99000 },
  2: { amount: 25, price: 249000 },
  3: { amount: 50, price: 499000 },
};

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async createTokenTransaction(userId: string, type: keyof typeof TOKEN_TYPES) {
    // TODO: Add checking logic buat ngecek apakah lagi ada transaksi unpaid sebelumnya
    const selectedPackage = TOKEN_TYPES[type];
    if (!selectedPackage) {
      throw new BadRequestException('Paket tidak valid!');
    }

    const transaction = await this.prisma.tokenTransaction.create({
      data: {
        amount: selectedPackage.amount,
        userId,
        type: 'UNPAID',
      },
    });

    // Generate mock QRIS dynaamically
    let qrisString = '';
    try {
      qrisString = this.updateQrisAmount(selectedPackage.price, transaction.id);
    } catch (error) {
      console.error('Gagal generate QRIS:', error);
      throw new BadRequestException('Gagal generate QRIS Code');
    }

    return {
      ...transaction,
      qris: qrisString,
      totalPrice: selectedPackage.price,
    };
  }

  async setPaid(transactionId: string) {
    // TODO: Add checking logic buat ngecek apakah udah paid sebelumnya, biar dia gak nambah token double

    const transaction = await this.prisma.tokenTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction)
      throw new BadRequestException('Transaksi tidak ditemukan!');
    // kalau transaksi sudah lunas, maka tidak akan mengubah apapun
    if (transaction.type === 'PAID') return transaction;

    const res = await this.prisma.tokenTransaction.update({
      where: {
        id: transactionId,
      },
      data: {
        type: 'PAID',
      },
    });

    await this.prisma.user.update({
      where: {
        id: res.userId,
      },
      data: {
        tokenBalance: {
          increment: res.amount,
        },
      },
    });

    return res;
  }

  checkTransactionStatus(transactionId: string) {
    return this.prisma.tokenTransaction.findUnique({
      where: {
        id: transactionId,
      },
    });
  }

  /**
   * Update nominal (tag 54) pada QRIS dan hitung ulang CRC.
   * - Mengubah 010211 -> 010212 (menjadi dynamic)
   * - Menyisipkan tag 54 sebelum "5802ID"
   * - Menghitung ulang CRC16-CCITT (poly 0x1021, init 0xFFFF) di akhir payload
   */
  updateQrisAmount(nominal: number | string, transactionId?: string): string {
    const qris = this.configService.get<string>('QRIS_ID');

    if (qris === undefined || qris === null || qris === '') {
      throw new Error('QRIS_ID belum dikonfigurasi di environment variables.');
    }

    if (nominal === undefined || nominal === null || nominal === '') {
      throw new Error('Parameter "nominal" wajib diisi.');
    }

    // toString nominal; biarkan apa adanya (boleh "10000" atau "10000.50" kalau dibutuhkan)
    const nominalStr =
      typeof nominal === 'number'
        ? String(nominal) // jika ingin selalu 2 desimal: nominal.toFixed(2).replace(/\.?0+$/, '')
        : String(nominal);

    // Utility lokal agar tetap satu fungsi saja
    const pad2 = (n: number) => (n < 10 ? '0' + n : String(n));
    const toCRC16 = (input: string) => {
      let crc = 0xffff;
      for (let i = 0; i < input.length; i++) {
        crc ^= input.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
          crc &= 0xffff; // jaga tetap 16-bit
        }
      }
      return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
    };

    // Buang CRC lama (4 char terakhir) tetapi tetap mempertahankan "6304" di before-end
    let base = qris?.slice(0, -4);

    // Pastikan jadi dynamic (010212). Abaikan jika sudah dynamic.
    base = base?.includes('010211') ? base.replace('010211', '010212') : base;

    // Sisipkan amount (tag 54) sebelum country code "5802ID"
    const splitMarker = '5802ID';
    const parts = base?.split(splitMarker);
    if (parts?.length < 2) {
      throw new Error('QRIS tidak valid: marker "5802ID" tidak ditemukan.');
    }

    const amountTag = '54' + pad2(nominalStr.length) + nominalStr;
    let payloadWithoutCRC = parts?.[0] + amountTag + splitMarker + parts?.[1];

    if (transactionId) {
      const tag62 = '62' + pad2(transactionId.length) + transactionId;
      payloadWithoutCRC += tag62;
    }

    payloadWithoutCRC += '6304'; // Tambahkan kembali tag CRC tanpa value

    // Hitung CRC baru dan gabungkan
    const newCrc = toCRC16(payloadWithoutCRC);
    return payloadWithoutCRC + newCrc;
  }
}
