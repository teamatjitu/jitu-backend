import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  NotFoundException,
  UseGuards,
  Session,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
@Controller('profile')
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Session() session: UserSession) {
    const userId = session.user.id;

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
    @Session() session: UserSession,
    @Body() body: { name?: string; target?: string },
  ) {
    const userId = session.user.id;

    if (!userId) {
      throw new NotFoundException('User ID tidak ditemukan');
    }

    return this.profileService.updateProfile(userId, body);
  }

  @Post('set-password')
  async setPassword(@Req() req: any, @Body() body: { password: string }) {
    const headers = new Headers(req.headers as any);

    return this.profileService.setPassword(headers, body.password);
  }
}
