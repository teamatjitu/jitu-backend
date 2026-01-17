import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '../../guards/auth.guard';
import { Session } from '../../decorators/session.decorator';
import type { UserSession } from '../../decorators/session.decorator'; // Gunakan import type!
import { ShopService } from './shop.service';

@Controller('shop')
@UseGuards(AuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('packages')
  async getPackages() {
    return this.shopService.getPackages();
  }

  @Post('create/:packageId')
  async createTransaction(
    @Session() session: UserSession,
    @Param('packageId') packageId: string,
  ) {
    if (!packageId) {
      throw new BadRequestException('Package ID required');
    }

    const res = await this.shopService.createTokenTransaction(
      session.user.id,
      packageId,
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
