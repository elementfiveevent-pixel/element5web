# 🎤 Element 5: Open Mic & Performance Battle Hub

Element 5 is a neobrutalist, gamified web platform built for open mic, poetry, stand-up comedy, and rap battle events. It features an interactive, real-time voting engine called **StageVerse**, automated ticketing check-ins, artist portfolios, and complete event organization tools.

---

## 🔑 Separate Registration Gateways (No Overlapping Roles)

To prevent account confusion and enforce strict separation between roles, Element 5 uses **different URLs** for each user category:

| User Type | Registration URL | Purpose |
| :--- | :--- | :--- |
| **🎤 Artist / Creator** | [/register](http://localhost:3000/register) | Create a profile, showcase video reels, and register to perform. |
| **👥 Audience / Voter** | [/register](http://localhost:3000/register) | Reserve tickets, vote in live events, and earn XP. |
| **💼 Event Organizer** | [/register/organizer](http://localhost:3000/register/organizer) | Register to host, schedule events, scan tickets, and view analytics. |
| **🛡️ System Admin** | *None (Disabled)* | Admin registration is disabled for security. Login only via `/admin/login`. |

*Note: The roles are completely separated—the public `/register` page does not contain admin/organizer options.*



## 🛠️ How to Run the Project Locally

Element 5 is split into two service layers:
* **Frontend**: Next.js (runs on port `3000`)
* **Backend**: NestJS (runs on port `4000` with raw PostgreSQL connections)

### 📋 Prerequisites
* **Node.js** (v18 or higher recommended)
* **PostgreSQL / Supabase Database instance**

---

### Step 1: Database Setup & Migration
1. Retrieve your database connection string (from your Supabase Project settings).
2. Open the file `backend/.env` and specify your connections:
   ```env
   DATABASE_URL="postgresql://postgres.your-id:password@aws-0.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.your-id:password@aws-0.supabase.com:5432/postgres"
   JWT_SECRET="element5_jwt_secret_token_signature_2026_key"
   ```
3. Run the SQL schema migrations to create the tables, indexes, and seeded credentials:
   ```bash
   cd backend
   npm run db:migrate
   ```

### Step 2: Start the Backend Server (NestJS)
Run the following commands to boot the NestJS backend in hot-reload development mode:
```bash
   cd backend
   npm install
   npm run start:dev
```
* **API Server Base URL**: [http://localhost:4000](http://localhost:4000)
* **Swagger API Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

### Step 3: Start the Frontend App (Next.js)
Run the following commands in the `frontend` folder to boot the web client:
```bash
   cd frontend
   npm install
   npm run dev
```
The web application will open on [http://localhost:3000](http://localhost:3000).

---

## 🏛️ Architecture & Custom Database Layer

Element 5 uses a NestJS backend designed around a custom query builder (`PostgresModel` in `backend/src/prisma/prisma.service.ts`) wrapping a standard PostgreSQL `pg.Pool`. 

* **Prisma stub**: The schema is designed similarly to a Prisma schema for migration purposes, but queries are executed directly as raw SQL in `PostgresModel` using a key map (`KEY_MAP`) to translate database column names (snake_case) to application properties (camelCase).
* **Relations**: Relations are resolved dynamically in `loadIncludes()`. Custom additions can be modeled directly inside the `loadIncludes()` switcher mapping within `prisma.service.ts`.
* **Caching & Queues**: Redis is utilized for cache storage and BullMQ processor queues for dispatching email and push notification workloads. Ensure Redis is running locally (`localhost:6379`).

---

## ⚡ Real-Time Voting Engine (StageVerse)

The live voting engine allows audience members to decide the winner of open mic sessions and battles:

* **For the Organizer**: 
  * Controls the live ballot from `/events/organizer?tab=voting`. Can toggle the voting gate `OPEN` or `CLOSED` or trigger a complete `RESET`.
  * Monitors live vote totals for each performer as they pour in.
* **For the Audience**:
  * Toggles the live view at `/stageverse`. If voting is closed, they watch the track preview. If opened, they are presented with a neobrutalist voting slip to select their favorite track.
* **For the Artist**:
  * Their uploaded YouTube showcase is read by the system, placing their track name and biography details automatically onto the ballot when approved.
