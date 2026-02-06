import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { getPrismaClient } from './prisma-client';
import * as nodemailer from 'nodemailer';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';

const logger = new Logger('Auth');

const getOrigin = () => {
  if (!process.env.FRONTEND_URL) {
    throw new Error('FRONTEND_URL environment variable must be set');
  }
  return process.env.FRONTEND_URL;
};

// --- SETUP NODEMAILER ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- LOAD EMAIL TEMPLATE ---
const getResetPasswordEmailTemplate = (url: string, email: string) => {
  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    'reset-password.html',
  );

  try {
    let template = fs.readFileSync(templatePath, 'utf-8');
    template = template.replaceAll('{{url}}', url);
    template = template.replaceAll('{{email}}', email);
    template = template.replaceAll('{{year}}', new Date().getFullYear().toString());
    return template;
  } catch {
    // Fallback to simple template if file not found
    logger.warn('Email template not found, using fallback');
    return `
      <h1>Reset Password Jitu Academy</h1>
      <p>Halo ${email},</p>
      <p>Klik link berikut untuk reset password: <a href="${url}">${url}</a></p>
      <p>Link ini akan kadaluarsa dalam 1 jam.</p>
    `;
  }
};

// Validate required environment variables at startup
const validateEnvVars = () => {
  if (!process.env.TRUSTED_ORIGINS) {
    throw new Error('TRUSTED_ORIGINS environment variable must be set');
  }
};

/**
 * Creates the Better Auth instance using the shared PrismaClient singleton.
 * This ensures only one database connection pool exists in the application.
 */
export const createAuth = () => {
  validateEnvVars();

  const prisma = getPrismaClient();
  const trustedOrigins = process.env.TRUSTED_ORIGINS!.split(',').map((o) =>
    o.trim(),
  );

  return betterAuth({
    baseURL: getOrigin(),
    trustedOrigins,
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
      async sendResetPassword(data) {
        logger.log(`Sending reset email to: ${data.user.email}`);

        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: data.user.email,
            subject: 'Reset Password Jitu Academy',
            html: getResetPasswordEmailTemplate(data.url, data.user.email),
          });
          logger.log('Email sent successfully');
        } catch (error) {
          logger.error('Failed to send email', error);
        }
      },
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirectUri: () => `${getOrigin()}/api/auth/callback/google`,
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
        target: {
          type: 'string',
          required: false,
          defaultValue: 'UTBK 2026',
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
};

// Export type for the auth instance
export type Auth = ReturnType<typeof createAuth>;

// Singleton auth instance for use with @thallesp/nestjs-better-auth
// Created lazily on first access to ensure environment variables are loaded
let authInstance: Auth | null = null;

export const getAuth = (): Auth => {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
};

// Default export for backward compatibility with app.module.ts
export const auth = getAuth();
