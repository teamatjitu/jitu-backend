import {
  Body,
  Controller,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { DashboardService } from './dashboard.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Put('profile')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async updateProfile(
    @Body() payload: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Session() session: UserSession,
  ) {
    return this.dashboardService.updateProfile(session.user.id, payload, file);
  }
}
