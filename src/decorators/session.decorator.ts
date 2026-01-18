import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Session = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Mengembalikan object yang sama strukturnya dengan library lama
    return {
      user: request.user,
      session: request.session,
    };
  },
);

// Interface pengganti UserSession
export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
    role?: string;
    // tambahkan properti lain sesuai kebutuhan
  };
  session: {
    id: string;
    // properti session lain
  };
}
