import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Body,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator'; // Gunakan import type!
import { ShopService } from './shop.service';
import type {
  CreateEWalletPaymentDto,
  MidtransNotificationDto,
} from './dto/ewallet.dto';

@Controller('shop')
@UseGuards(AuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('packages')
  async getPackages() {
    return this.shopService.getPackages();
  }

  /**
   * Get current pending e-wallet payment
   */
  @Get('pending-payment')
  async getPendingPayment(@Session() session: UserSession) {
    const pending = await this.shopService.getPendingEWalletPayment(
      session.user.id,
    );
    return { pending };
  }

  /**
   * Cancel a pending payment
   */
  @Post('cancel/:paymentId')
  async cancelPayment(
    @Session() session: UserSession,
    @Param('paymentId') paymentId: string,
  ) {
    return this.shopService.cancelPayment(session.user.id, paymentId);
  }

  @Post('create/:packageId')
  async createTransaction(
    @Session() session: UserSession,
    @Param('packageId') packageId: string,
    @Query('callback_url') callbackUrl?: string,
  ) {
    if (!packageId) {
      throw new BadRequestException('Package ID required');
    }

    // Now uses Midtrans e-wallet instead of static QRIS
    const res = await this.shopService.createEWalletPayment(
      session.user.id,
      packageId,
      callbackUrl,
    );
    return res;
  }

  @Post('check/:transactionId')
  checkTransactionStatus(@Param('transactionId') transactionId: string) {
    return this.shopService.checkTransactionStatus(transactionId);
  }

  @Post('webhook')
  async handlePaymentWebhook(@Body() body: { transactionId: string }) {
    if (!body.transactionId) {
      throw new BadRequestException('transactionId is required');
    }
    return this.shopService.setPaid(body.transactionId);
  }

  /**
   * Create E-Wallet payment (GoPay/QRIS)
   */
  @Post('ewallet/create/:packageId')
  async createEWalletPayment(
    @Session() session: UserSession,
    @Param('packageId') packageId: string,
    @Query('callback_url') callbackUrl?: string,
  ) {
    if (!packageId) {
      throw new BadRequestException('Package ID required');
    }

    return this.shopService.createEWalletPayment(
      session.user.id,
      packageId,
      callbackUrl,
    );
  }

  /**
   * Midtrans webhook notification handler
   */
  @Post('midtrans/notification')
  async handleMidtransNotification(
    @Body() notification: MidtransNotificationDto,
  ) {
    return this.shopService.handleMidtransNotification(notification);
  }

  @Get('pending')
  async getPendingTransactions(@Session() session: UserSession) {
    return this.shopService.getPendingTransactions(session.user.id);
  }

  @Get('past')
  async getPastTransactions(@Session() session: UserSession) {
    return this.shopService.getPastTransactions(session.user.id);
  }

  @Get('data/:transactionId')
  async getTransactionData(
    @Session() session: UserSession,
    @Param('transactionId') transactionId: string,
  ) {
    return this.shopService.getData(session.user.id, transactionId);
  }
}
