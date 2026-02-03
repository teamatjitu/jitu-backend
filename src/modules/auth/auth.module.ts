import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { getAuth } from '../../lib/auth';

export const AUTH_PROVIDER = 'BETTER_AUTH';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: AUTH_PROVIDER,
      useFactory: () => getAuth(),
    },
  ],
  exports: [AUTH_PROVIDER],
})
export class AuthModule {}
