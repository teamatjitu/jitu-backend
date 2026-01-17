import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const getOrigin = (req: Request) => {
  // Fly sets x-forwarded-proto to "https"
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host');

  // If running locally and FRONTEND_URL is set, use that
  if (!host && process.env.FRONTEND_URL) return process.env.FRONTEND_URL;

  return `${proto}://${host}`;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({
  adapter,
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    'http://localhost:5173',
    'https://jitu-frontend-staging.vercel.app',
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      redirectUri: (req: Request) =>
        `${getOrigin(req)}/api/auth/callback/google`,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
        input: false,
      },
    },
  },

  advanced: {
    cookies: {
      session_token: {
        attributes: {
          sameSite: 'None',
          secure: true,
          httpOnly: true,
        },
      },
    },
  },
});
