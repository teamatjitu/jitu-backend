import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { getAuth } from '../../lib/auth';
import { AUTH_PROVIDER } from './auth.constants';

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
