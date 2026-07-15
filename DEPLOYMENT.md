# 🚀 Deployment Guide: Element 5 Platform

This document describes how to deploy the **Element 5** platform (Next.js Frontend & NestJS Backend) to production.

---

## ❓ Can we deploy the entire project on Vercel?

**Short Answer**: You should deploy the **Frontend on Vercel**, but the **Backend (NestJS) on Render, Railway, or Heroku**.

### Why?
1. **WebSockets / Real-Time Voting**: The **StageVerse** voting terminal relies on live WebSockets (Socket.io) to transmit votes instantly. Vercel is a **serverless** platform. Serverless functions terminate after a few seconds and **do not support persistent WebSocket connections**.
2. **Server Lifecycle**: NestJS is built as a stateful, long-running server application. Running it as serverless functions on Vercel causes slow cold starts and connection limits on your database pool.

---

## 🗺️ Recommended Deployment Architecture

```mermaid
graph TD
    User([User's Browser]) -->|Loads App| Vercel[Vercel: Frontend Next.js]
    User -->|Real-Time WS & REST API| Render[Render / Railway: Backend NestJS]
    Render -->|Queries| Supabase[(Supabase: PostgreSQL Database)]
```

---

## 🎨 Part 1: Deploying the Database & Storage (Supabase)

1. **Database Project**:
   * Sign in to [Supabase](https://supabase.com/).
   * Create a new project. Keep note of the **Database Password**.
   * Go to **Project Settings** -> **Database**.
   * Retrieve the connection strings:
     * **Connection String (Transaction/Session)**: Used for `DATABASE_URL` (usually port `6543`).
     * **Connection String (Direct)**: Used for `DIRECT_URL` (usually port `5432`).
    * Open your SQL Editor in Supabase, copy the contents of the database schema script ([`backend/scripts/schema.sql`](file:///d:/All%20Project/element%20five%20website/backend/scripts/schema.sql)), and run it to create tables and database schemas.

2. **Storage Bucket Configuration**:
   * Go to your **Supabase Dashboard** -> **Storage** (on the left menu).
   * Click **New bucket**.
   * Name the bucket exactly **`media`** (must be lowercase).
   * **Crucial**: Turn **ON** the **Public bucket** toggle. This allows the public URLs of event flyer images and payment receipts to load correctly in browsers.
   * *Note: All assets share this single bucket and are organized automatically into subdirectories (`media/flyers/...`, `media/qrs/...`, and `media/payments/...`).*

---

## 💼 Part 2: Deploying the Backend (Render or Railway)

We recommend **Render** or **Railway** for NestJS because they support long-running processes and WebSockets out of the box.

### Option A: Deploying to Railway (Recommended)
1. Go to [Railway.app](https://railway.app/) and sign in with your GitHub account.
2. Click **New Project** -> Select **Deploy from GitHub repo**.
3. Choose your repository from the list.
4. Click **Configure Service** before deploying:
   * Set the **Root Directory** to `backend`.
5. Go to the **Variables** tab of the service and add:
   * `DATABASE_URL` = *[Your Supabase Transaction Pooler URL]*
   * `DIRECT_URL` = *[Your Supabase Direct Connection URL]*
   * `JWT_SECRET` = *[Generate a strong secret string]*
   * `PORT` = `4000`
6. Go to the **Settings** tab -> Under the **Networking** section, click **Generate Domain** to expose the API to the public. Copy this URL.

### Option B: Deploying to Render
1. Go to [Render](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   * **Root Directory**: `backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start:prod`
4. Go to the **Environment** tab and add your variables:
   * `DATABASE_URL` = *[Your Supabase Transaction URL]*
   * `DIRECT_URL` = *[Your Supabase Direct URL]*
   * `JWT_SECRET` = *[Generate a strong secret string]*
   * `PORT` = `4000`
5. Copy the generated Web Service URL.

---

## 🎤 Part 3: Deploying the Frontend (Vercel)

1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New** -> **Project**.
3. Select your repository.
4. In the configuration settings:
   * **Framework Preset**: `Next.js`
   * **Root Directory**: `frontend`
5. Open **Environment Variables** and add:
   * `NEXT_PUBLIC_API_URL` = *[The public URL of your deployed NestJS backend on Render or Railway]*
6. Click **Deploy**.

---

## 🧪 Post-Deployment Checklists

1. **CORS Security**: Ensure your backend CORS configuration permits requests from your frontend Vercel URL.
2. **WebSocket Handshakes**: Navigate to the live `/stageverse` page, open your browser's Developer Tools Console, and confirm that there are no connection errors or failed WebSocket handshakes.
3. **Transaction Screenshot Autoclean**:
   * *Note: When an event status is updated to `COMPLETED`, `CANCELLED`, or `ARCHIVED` in the organizer panel, the NestJS backend automatically executes a database cleanup, clearing out the `paymentScreenshotUrl` values of all registrations to protect user transaction privacy.*
