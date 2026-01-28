import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as nodemailer from 'nodemailer';

const getOrigin = (req: Request) => {
  // HARDCODE untuk memastikan tidak ada kesalahan pembacaan env atau header
  // Ini memaksa semua redirect OAuth kembali ke Frontend Vercel
  return process.env.FRONTEND_URL;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({
  adapter,
});

// --- SETUP NODEMAILER ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// --- TEMPLATE EMAIL HELPER ---
const getResetPasswordEmailTemplate = (url: string, email: string) => {
  // Ganti URL logo ini dengan URL logo Jitu Academy yang sudah di-hosting (Cloudinary/S3/dll)
  // Jika belum ada, bisa pakai teks saja.
  const brandColor = '#2563eb'; // Biru Jitu Academy

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password Jitu Academy</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          
          <tr>
            <td align="center" style="background-color: ${brandColor}; padding: 30px;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 1px;">JITU ACADEMY</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Reset Password Anda</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Halo, <strong>${email}</strong>.<br><br>
                Kami menerima permintaan untuk mereset password akun Jitu Academy Anda. 
                Jika Anda yang memintanya, silakan klik tombol di bawah ini:
              </p>

              <table role="presentation" border="0" cellspacing="0" cellpadding="0" width="100%">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${url}" target="_blank" style="background-color: ${brandColor}; color: #ffffff; display: inline-block; padding: 14px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-top: 24px;">
                Link ini akan kadaluarsa dalam 1 jam. Jika tombol di atas tidak berfungsi, salin dan tempel link berikut ke browser Anda:
              </p>
              <p style="background-color: #f9fafb; padding: 12px; border-radius: 4px; border: 1px solid #e5e7eb; word-break: break-all; font-size: 12px; color: #6b7280;">
                <a href="${url}" style="color: ${brandColor}; text-decoration: none;">${url}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 13px; margin: 0;">
                Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.
              </p>
            </td>
          </tr>
          
          <tr>
            <td align="center" style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Jitu Academy. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export const auth = betterAuth({
  baseURL: process.env.FROTEND_URL, // Hardcode baseURL juga
  trustedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://jitu-frontend-staging.vercel.app',
    'https://jituptn.vercel.app',
    ...(process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(',')
      : []),
  ],
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      console.log(`[AUTH] Sending reset email to: ${data.user.email}`);

      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: data.user.email,
          subject: '🔒 Reset Password Jitu Academy', // Subject lebih menarik dengan emoji
          html: getResetPasswordEmailTemplate(data.url, data.user.email),
        });
        console.log(`[AUTH] Email sent successfully.`);
      } catch (error) {
        console.error('[AUTH] Failed to send email:', error);
      }
    },
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
