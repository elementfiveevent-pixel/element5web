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

The live voting engine allows event organizers to coordinate performances and enables audience members to rate active performers in real-time.

### 🔗 Voting System URLs & Pages
*   **💼 [Organizer Voting Panel](http://localhost:3000/events/organizer?tab=voting)**: The command center where organizers manage the performance lineup, trigger countdown timers, and control leaderboard visibility.
*   **👥 [Audience Voting Terminal](http://localhost:3000/stageverse/voting-system)**: The secure, real-time interface for audience members to rate the active performer on a scale of 1-10.
*   **🎪 [Event Details & Ballots Link](http://localhost:3000/events/event-id)**: The public event page showing the live voting alert banner (when active), links to the terminal, and registration options.

---

### 🛠️ How it Works & Features

#### 1. Organizer Control Center
*   **⚡ Event Control (Tab 1)**: Select which artist is currently performing. Start a custom performance countdown timer and a voting round timer simultaneously, or operate them individually. Includes real-time telemetry like total votes cast and cumulative average score.
*   **🎤 Manage Performers (Tab 2)**: Reorder the performance sequence lineup, skip no-shows, edit details, and add new performers. Supports single additions (registered platform artists or custom guest performers) and bulk imports (paste a list of names).
*   **🏆 Leaderboard (Tab 3)**: View ranked standings in real-time. Features toggles to hide/reveal scores (privacy blur), cast standings "On Stage" (public visibility), export results to CSV, or trigger a full event data reset.

#### 2. Gatekeeping & Access Controls
*   **Auto-Approved Voter Status**: Registered attendees who purchased ticket registrations automatically get direct access to vote.
*   **Access Request Queue**: Attendee requests from users who don't hold tickets are placed in a live queue on the organizer dashboard for manual approval or rejection.

#### 3. Real-Time Syncing (Socket.io)
*   When the organizer starts a voting round or switches the current active performer, the audience terminal instantly updates to display the active slot. Voting buttons and rating selectors are hidden out of turn to ensure leaderboard accuracy.

