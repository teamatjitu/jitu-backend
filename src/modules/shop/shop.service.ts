import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

// Untuk sekarang, tipe token yang dibeli hard-coded
const TOKEN_TYPES = {
  1: 10,
  2: 25,
  3: 50,
};

@Injectable()
export class ShopService {
  constructor(private readonly prisma: PrismaService) {}

  createTokenTransaction(userId: string, type: keyof typeof TOKEN_TYPES) {
    // TODO: Add checking logic buat ngecek apakah lagi ada transaksi unpaid sebelumnya
    const tokenAmount = TOKEN_TYPES[type];

    return this.prisma.tokenTransaction.create({
      data: {
        amount: tokenAmount,
        userId,
        type: 'UNPAID',
      },
    });
  }

  async setPaid(transactionId: string) {
    // TODO: Add checking logic buat ngecek apakah udah paid sebelumnya, biar dia gak nambah token double
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
}
