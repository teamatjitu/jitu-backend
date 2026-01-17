import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session) {
      throw new UnauthorizedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).user = session.user;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (request as any).session = session.session;

    return true;
  }
}
