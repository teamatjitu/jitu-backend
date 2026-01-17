import {
  BadRequestException,
  Controller,
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
}
