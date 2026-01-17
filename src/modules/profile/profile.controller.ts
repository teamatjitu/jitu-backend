import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      throw new NotFoundException('User ID tidak ditemukan');
    }

    const profile = await this.profileService.getProfile(userId);

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return profile;
  }

  @Patch()
  async updateProfile(
    @Req() req: any,
    @Body() body: { name?: string; target?: string },
  ) {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      throw new NotFoundException('User ID tidak ditemukan');
    }

    return this.profileService.updateProfile(userId, body);
  }
}
