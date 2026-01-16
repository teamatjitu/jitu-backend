import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug-env')
  getEnv() {
    return {
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      HAS_SECRET: !!process.env.BETTER_AUTH_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      NODE_ENV: process.env.NODE_ENV,
    };
  }
}
