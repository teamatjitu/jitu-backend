import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Session,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { ShopService } from './shop.service';

@Controller('shop')
@UseGuards(AuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Post('create/:type')
  async createTransaction(
    @Session() session: UserSession,
    @Param('type') type: string,
  ) {
    const intType = parseInt(type, 10);

    if (isNaN(intType)) {
      throw new BadRequestException('Invalid type');
    }

    if (intType < 1 || intType > 3) {
      throw new BadRequestException('Invalid type');
    }

    const res = await this.shopService.createTokenTransaction(
      session.user.id,
      intType as 1 | 2 | 3,
    );

    // Karena cuma simulasi, transaksinya keresolve setelah 3 detik
    // setTimeout(() => {
    //   this.shopService.setPaid(res.id);
    // }, 3000);

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
