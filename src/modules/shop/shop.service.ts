import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { ConfigService } from '@nestjs/config';
import { MidtransService } from './services/midtrans.service';
import type {
  EWalletPaymentResponse,
  MidtransNotificationDto,
} from './dto/ewallet.dto';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly midtransService: MidtransService,
  ) {}

  // Ambil daftar paket dari database
  async getPackages() {
    return this.prisma.tokenPackage.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Get user's pending e-wallet payment if exists
   */
  async getPendingEWalletPayment(userId: string) {
    const pendingPayment = await this.prisma.payment.findFirst({
      where: {
        userId,
        status: 'PENDING',
        paymentMethod: { in: ['GOPAY', 'QRIS'] },
      },
      include: {
        tokenPackage: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!pendingPayment) {
      return null;
    }

    // Check if payment is expired (15 minutes)
    const expiryTime = new Date(pendingPayment.createdAt);
    expiryTime.setMinutes(expiryTime.getMinutes() + 15);
    const isExpired = new Date() > expiryTime;

    if (isExpired) {
      // Auto-cancel expired payment
      await this.prisma.payment.update({
        where: { id: pendingPayment.id },
        data: { status: 'CANCELLED' },
      });
      return null;
    }

    return {
      ...pendingPayment,
      expiresAt: expiryTime,
      isExpired,
    };
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(userId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
        status: 'PENDING',
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found or already processed');
    }

    // Try to cancel on Midtrans side if we have transaction ID
    if (payment.metadata && typeof payment.metadata === 'object') {
      const metadata = payment.metadata as any;
      if (metadata.midtrans_transaction_id) {
        try {
          await this.midtransService.cancelTransaction(payment.orderId);
        } catch (error) {
          console.error('Failed to cancel on Midtrans:', error);
          // Continue with local cancellation even if Midtrans fails
        }
      }
    }

    // Update payment status to CANCELLED
    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'CANCELLED' },
    });

    return {
      success: true,
      message: 'Payment cancelled successfully',
      payment: updatedPayment,
    };
  }

  async createTokenTransaction(userId: string, packageId: string) {
    // Cari paket di database
    const selectedPackage = await this.prisma.tokenPackage.findUnique({
      where: { id: packageId },
    });

    if (!selectedPackage) {
      throw new BadRequestException('Paket tidak valid atau tidak ditemukan!');
    }

    // TODO: Add logic cek unpaid transaction jika perlu

    // Buat Payment/Transaction baru
    // Sesuaikan dengan schema Payment yang baru (ada orderId)
    // Gunakan Payment model, bukan TokenTransaction (karena schema sudah berubah ke Payment + TokenPackage)
    // TAPI, kode lama pakai TokenTransaction. Mari kita cek schema sebentar.
    // Asumsi: Kita migrasi ke model Payment yang terhubung ke TokenPackage.

    // Karena TokenTransaction di schema lama agak beda dengan Payment baru,
    // Saya akan sesuaikan dengan schema Payment yang ada di seed.ts tadi.

    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transaction = await this.prisma.payment.create({
      data: {
        userId,
        tokenPackageId: selectedPackage.id,
        orderId,
        amount: selectedPackage.price,
        tokenAmount: selectedPackage.tokenAmount,
        status: 'PENDING',
        paymentMethod: 'QRIS_STATIC',
      },
    });

    // Generate QRIS
    let qrisString = '';
    try {
      qrisString = this.updateQrisAmount(
        selectedPackage.price,
        transaction.orderId,
      );
    } catch (error) {
      console.error('Gagal generate QRIS:', error);
      throw new BadRequestException('Gagal generate QRIS Code');
    }

    return {
      ...transaction,
      qris: qrisString,
      packageName: selectedPackage.name,
    };
  }

  /**
   * Create E-Wallet payment using Midtrans GoPay
   */
  async createEWalletPayment(
    userId: string,
    packageId: string,
    callbackUrl?: string,
  ): Promise<EWalletPaymentResponse> {
    // Find package
    const selectedPackage = await this.prisma.tokenPackage.findUnique({
      where: { id: packageId },
    });

    if (!selectedPackage) {
      throw new BadRequestException('Package not found or invalid!');
    }

    // Check for existing pending transactions
    const existingPending = await this.prisma.payment.findFirst({
      where: {
        userId,
        tokenPackageId: packageId,
        status: 'PENDING',
        paymentMethod: { in: ['GOPAY', 'QRIS'] },
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'You have a pending e-wallet transaction. Please complete or cancel it first.',
      );
    }

    // Generate unique order ID
    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        tokenPackageId: selectedPackage.id,
        orderId,
        amount: selectedPackage.price,
        tokenAmount: selectedPackage.tokenAmount,
        status: 'PENDING',
        paymentMethod: 'GOPAY',
      },
    });

    try {
      // Call Midtrans Charge API
      const chargeResponse = await this.midtransService.createEWalletCharge(
        orderId,
        selectedPackage.price,
        callbackUrl,
      );

      // Extract QR Code and Deeplink URLs from actions
      const qrCodeAction = chargeResponse.actions.find(
        (action) => action.name === 'generate-qr-code',
      );
      const deeplinkAction = chargeResponse.actions.find(
        (action) => action.name === 'deeplink-redirect',
      );

      // Update payment with Midtrans transaction ID
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            midtrans_transaction_id: chargeResponse.transaction_id,
            qr_code_url: qrCodeAction?.url,
            deeplink_url: deeplinkAction?.url,
          },
        },
      });

      return {
        transactionId: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        tokenAmount: payment.tokenAmount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        qrCodeUrl: qrCodeAction?.url,
        deeplinkUrl: deeplinkAction?.url,
        expiryTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        packageName: selectedPackage.name,
      };
    } catch (error) {
      // If Midtrans API fails, delete the payment record
      await this.prisma.payment.delete({ where: { id: payment.id } });
      throw new BadRequestException(
        `Failed to create e-wallet payment: ${error.message}`,
      );
    }
  }

  async getPendingTransactions(userId: string) {
    const transactions = await this.prisma.payment.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        tokenPackage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((trx) => ({
      ...trx,
      totalPrice: trx.amount, // Map amount to totalPrice for frontend compatibility
      packageName: trx.tokenPackage.name,
    }));
  }

  async getPastTransactions(userId: string) {
    const transactions = await this.prisma.payment.findMany({
      where: {
        userId,
        status: { not: 'PENDING' },
      },
      include: {
        tokenPackage: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return transactions.map((trx) => ({
      ...trx,
      totalPrice: trx.amount, // Map amount to totalPrice for frontend compatibility
      packageName: trx.tokenPackage.name,
    }));
  }

  async getData(userId: string, transactionId: string) {
    const transaction = await this.prisma.payment.findUnique({
      where: { id: transactionId }, // Cari berdasarkan ID (Primary Key)
      include: { tokenPackage: true },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new BadRequestException('Transaksi tidak ditemukan!');
    }

    let qrisString = '';
    try {
      // Gunakan amount transaksi, bukan dari paket (karena harga bisa berubah)
      qrisString = this.updateQrisAmount(
        transaction.amount,
        transaction.orderId,
      );
    } catch (error) {
      console.error('Gagal generate QRIS:', error);
    }

    return {
      ...transaction,
      totalPrice: transaction.amount, // Map amount -> totalPrice
      qris: qrisString,
      packageName: transaction.tokenPackage.name,
    };
  }

  // Webhook atau Manual Check
  async setPaid(transactionId: string) {
    // Cari by ID (karena webhook mungkin kirim ID) atau orderId?
    // Biasanya Midtrans kirim orderId. Tapi fungsi ini parameter namanya transactionId.
    // Kita coba cari by ID dulu, kalau gagal cari by orderId (opsional).
    // Tapi amannya kita asumsikan transactionId adalah ID database.

    const transaction = await this.prisma.payment.findUnique({
      where: { id: transactionId },
    });

    if (!transaction)
      throw new BadRequestException('Transaksi tidak ditemukan!');
    if (transaction.status === 'CONFIRMED') return transaction;

    // Update Status Transaksi
    return await this.prisma.$transaction(async (tx) => {
      const res = await tx.payment.update({
        where: { id: transactionId },
        data: { status: 'CONFIRMED' },
      });

      await tx.user.update({
        where: { id: res.userId },
        data: {
          tokenBalance: { increment: res.tokenAmount },
        },
      });
      return res;
    });
  }

  /**
   * Handle Midtrans webhook notification
   */
  async handleMidtransNotification(
    notification: MidtransNotificationDto,
  ): Promise<{ success: boolean; message: string }> {
    // Verify signature
    const isValid = this.midtransService.verifySignature(notification);
    if (!isValid) {
      throw new BadRequestException('Invalid signature');
    }

    // Find payment by order_id
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: notification.order_id },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    // Map Midtrans status to our status
    const newStatus = this.midtransService.mapTransactionStatus(
      notification.transaction_status || '',
      notification.fraud_status,
    );

    // Update payment status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        metadata: {
          ...(payment.metadata as any),
          last_notification: notification,
          updated_at: new Date().toISOString(),
        },
      },
    });

    // If payment is confirmed, credit user's token balance
    if (newStatus === 'CONFIRMED' && payment.status !== 'CONFIRMED') {
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: {
          tokenBalance: { increment: payment.tokenAmount },
        },
      });

      return {
        success: true,
        message: 'Payment confirmed and tokens credited',
      };
    }

    return {
      success: true,
      message: `Payment status updated to ${newStatus}`,
    };
  }

  checkTransactionStatus(transactionId: string) {
    return this.prisma.payment.findUnique({
      where: {
        id: transactionId,
      },
    });
  }

  /**
   * Update nominal (tag 54) pada QRIS dan hitung ulang CRC.
   */
  updateQrisAmount(nominal: number | string, transactionId?: string): string {
    const qris = this.configService.get<string>('QRIS_ID');

    if (!qris) throw new Error('QRIS_ID belum dikonfigurasi.');
    if (!nominal) throw new Error('Nominal wajib diisi.');

    const nominalStr = String(nominal);
    const pad2 = (n: number) => (n < 10 ? '0' + n : String(n));

    // Simple CRC16-CCITT implementation
    const toCRC16 = (input: string) => {
      let crc = 0xffff;
      for (let i = 0; i < input.length; i++) {
        crc ^= input.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
          crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
          crc &= 0xffff;
        }
      }
      return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
    };

    let base = qris.slice(0, -4);
    base = base.includes('010211') ? base.replace('010211', '010212') : base;

    const splitMarker = '5802ID';
    const parts = base.split(splitMarker);
    if (parts.length < 2) throw new Error('QRIS Marker 5802ID not found');

    const amountTag = '54' + pad2(nominalStr.length) + nominalStr;
    let payload = parts[0] + amountTag + splitMarker + parts[1];

    if (transactionId) {
      // Potong transactionId jika terlalu panjang agar muat di QRIS (max length tag 62 variatif)
      const safeId = transactionId.slice(0, 20);
      const tag62 = '62' + pad2(safeId.length) + safeId;
      payload += tag62;
    }

    payload += '6304';
    return payload + toCRC16(payload);
  }
}
