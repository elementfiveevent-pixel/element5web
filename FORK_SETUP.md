# Fork Setup

This fork already contains both parts of the application:

- `frontend/` is the Next.js website deployed on Vercel.
- `backend/` is the NestJS API deployed on Render.
- Supabase provides PostgreSQL and the `media` storage bucket.

The missing files in a fork are normally local env files and platform links. That is expected because `.env`, `.env.local`, and `.vercel` are intentionally ignored.

## 1. Backend API

Create a local backend env file:

```bash
cd backend
cp .env.example .env
```

Fill these required values:

- `DATABASE_URL`: Supabase pooled PostgreSQL connection string.
- `DIRECT_URL`: Supabase direct PostgreSQL connection string, if you use direct migrations.
- `JWT_SECRET`: strong private signing secret.
- `ADMIN_TOTP_SECRET`: strong private TOTP secret for production.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Supabase anon/publishable key.
- `CORS_ORIGIN`: local frontend URL plus your Vercel frontend URL.

Then install and run:

```bash
npm install
npm run db:migrate
npm run start:dev
```

The local API runs at `http://localhost:4000`, and Swagger docs are at `http://localhost:4000/api/docs`.

## 2. Frontend Website

Create a local frontend env file:

```bash
cd frontend
cp .env.example .env.local
```

Fill these values:

- `NEXT_PUBLIC_API_URL`: `http://localhost:4000` locally, or the Render backend URL in Vercel.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon/publishable key.
- `NEXT_PUBLIC_FIREBASE_*`: Firebase browser config values if Google sign-in is enabled.

Then install and run:

```bash
npm install
npm run dev
```

The website runs at `http://localhost:3000`.

## 3. Vercel

Deploy only the `frontend/` folder on Vercel. In the Vercel project settings, add:

- `NEXT_PUBLIC_API_URL`: your Render backend URL.
- `NEXT_PUBLIC_SUPABASE_URL`: your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: your Supabase anon/publishable key.
- `NEXT_PUBLIC_FIREBASE_*`: Firebase public config values, if used.

If the project is already linked to Vercel and you are logged in locally, you can pull the development envs:

```bash
cd frontend
vercel env pull .env.local --yes
```

## 4. Render

Deploy the `backend/` folder on Render as a Node web service:

- Build command: `npm install && npm run build`
- Start command: `npm run start:prod`
- Runtime port: the app reads `PORT`, and Render provides it automatically.

Add these Render environment variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `ADMIN_TOTP_SECRET`
- `CORS_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Optional: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Optional: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`

After Render gives you the backend URL, paste it into Vercel as `NEXT_PUBLIC_API_URL`.

## 5. Supabase

Run `backend/scripts/schema.sql` in Supabase SQL Editor or run the backend migration script after setting `DATABASE_URL`.

Create a public storage bucket named `media` for uploaded flyers, QR images, and payment screenshots. Keep the service role key out of frontend code and out of committed files.
