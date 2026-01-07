import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './services/admin.service';
import { AdminTryoutService } from './services/tryout.service';
import { AdminSubtestService } from './services/subtest.service';
import { AdminQuestionService } from './services/question.service';
import { CreateTryoutDto } from './dto/create-tryout.dto';
import { UpdateTryoutDto } from './dto/update-tryout.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { AdminUserService } from './services/user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly tryoutService: AdminTryoutService,
    private readonly subtestService: AdminSubtestService,
    private readonly questionService: AdminQuestionService,
    private readonly userService: AdminUserService,
  ) {}

  // --- DASHBOARD ---
  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // --- TRYOUT ---
  @Get('tryouts')
  getTryouts() {
    return this.tryoutService.getTryouts();
  }

  @Post('tryouts')
  async createTryout(@Body() createTryoutDto: CreateTryoutDto) {
    return this.tryoutService.createTryout(createTryoutDto);
  }

  @Get('tryouts/:id')
  getTryoutById(@Param('id') id: string) {
    return this.tryoutService.getTryoutById(id);
  }

  @Patch('tryouts/:id')
  updateTryout(
    @Param('id') id: string,
    @Body() updateTryoutDto: UpdateTryoutDto,
  ) {
    return this.tryoutService.updateTryout(id, updateTryoutDto);
  }

  @Delete('tryouts/:id')
  deleteTryout(@Param('id') id: string) {
    return this.tryoutService.deleteTryout(id);
  }

  // --- SUBTEST ---
  @Post('subtests/:tryoutId')
  createSubtest(@Param('tryoutId') tryoutId: string) {
    return this.subtestService.createUtbkSubtests(tryoutId);
  }

  @Get('tryouts/:tryoutId/subtests')
  getSubtestsByTryout(@Param('tryoutId') tryoutId: string) {
    return this.subtestService.getSubtestsByTryoutId(tryoutId);
  }

  @Get('subtests/:id')
  getSubtestById(@Param('id') id: string) {
    return this.subtestService.getSubtestById(id);
  }

  // --- QUESTION ---
  @Get('subtests/:subtestId/questions')
  getQuestionsBySubtest(@Param('subtestId') subtestId: string) {
    return this.questionService.getQuestionBySubtestId(subtestId);
  }

  @Post('subtests/:subtestId/questions')
  createQuestion(
    @Param('subtestId') subtestId: string,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionService.createQuestion(dto, subtestId);
  }

  @Patch('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.questionService.updateQuestion(dto, id);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.questionService.deleteQuestion(id);
  }

  // --- UPLOAD ---
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url =
      await this.questionService.uploadQuestionImageToCloudinary(file);
    return { url };
  }

  @Get('user')
  getAllUsers() {
    return this.userService.getAllUser();
  }

  @Patch('user/:id')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(updateUserDto, id);
  }

  @Delete('user/:id')
  removeUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
