import { Controller, All, Req, Res, Inject } from '@nestjs/common';
import { toNodeHandler } from 'better-auth/node';
import { AUTH_PROVIDER } from './auth.constants';
import type { Auth } from '../../lib/auth';
import type { Request, Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(@Inject(AUTH_PROVIDER) private readonly auth: unknown) {}

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return toNodeHandler(this.auth as Auth)(req, res);
  }
}
