# Backend Production: GCP Cloud Run

Target production shape:

- Backend API: GCP Cloud Run
- Database: Supabase Postgres
- Asset storage: Cloudinary
- Frontend origin: Vercel Pro
- AI provider implementation: skipped for now; keep AI service on demo mode until OpenAI providers are enabled.

## Required Environment

Use `.env.production.example` as the Cloud Run variable checklist. Important values:

- `HOST=0.0.0.0`
- `PORT=8080`
- `DATABASE_URL` from Supabase with `sslmode=require`
- `FRONTEND_URL=https://YOUR_VERCEL_DOMAIN`
- `BETTER_AUTH_URL=https://YOUR_BACKEND_CLOUD_RUN_URL`
- `ALLOWED_ORIGINS=https://YOUR_VERCEL_DOMAIN`
- `TRUSTED_ORIGINS=https://YOUR_VERCEL_DOMAIN`
- `AI_SERVICE_URL=https://YOUR_AI_SERVICE_CLOUD_RUN_URL`
- `AI_SERVICE_INTERNAL_API_KEY` must match the AI service `INTERNAL_API_KEY`
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

## Build And Deploy

```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/jitu-backend
gcloud run deploy jitu-backend \
  --image gcr.io/PROJECT_ID/jitu-backend \
  --region asia-southeast2 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080
```

Set secrets through Cloud Run environment variables or Secret Manager. Do not commit real secrets.

## Database Migration

Run Prisma migrations against Supabase before routing traffic:

```bash
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy
```

For the first production admin user, create the account through the app, then promote it with a controlled DB update.
