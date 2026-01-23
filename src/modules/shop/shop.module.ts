import { Module } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';
import { MidtransService } from './services/midtrans.service';

@Module({
  controllers: [ShopController],
  providers: [ShopService, MidtransService],
})
export class ShopModule {}
