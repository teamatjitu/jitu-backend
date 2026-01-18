import {
  Controller,
  Get,
  Req,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@thallesp/nestjs-better-auth';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  // @UseGuards(AuthGuard) // Aktifkan jika ingin pakai guard bawaan Better Auth
  async getProfile(@Req() req: any) {
    // Ambil ID dari user session (better-auth) ATAU header manual x-user-id
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
}
