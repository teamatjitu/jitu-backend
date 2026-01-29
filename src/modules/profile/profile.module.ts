import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from '../../prisma.module'; // Import PrismaModule
import { ShopModule } from '../shop/shop.module';

@Module({
  imports: [PrismaModule, ShopModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
