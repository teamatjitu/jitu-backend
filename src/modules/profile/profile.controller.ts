// src/modules/profile/profile.controller.ts
import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { auth } from '../../lib/auth'; // Import helper auth better-auth
import { fromNodeHeaders } from 'better-auth/node';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('stats')
  async getStats(@Req() req) {
    // Verifikasi Session manual menggunakan better-auth helper
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers)
    })

    if (!session) {
      throw new UnauthorizedException();
    }

    return this.profileService.getProfileStats(session.user.id);
  }
}