# 🎤 Element 5: Deployment Build & Feature Checkup Guide

This document contains instructions to verify that both the backend and frontend services build cleanly for production deployment, along with a step-by-step checklist to verify all features and security gates manually.

---

## 🛠️ Part 1: Production Build Verification

Run these commands in separate terminal sessions from the root directory of the project to confirm that there are no compilation, syntax, or typescript errors before deploying.

### 1. Verify Backend Build (NestJS)
```bash
# Navigate to backend folder
cd backend

# Clean install dependencies
npm install

# Compile the TypeScript codebase for production
npm run build
```
*Expected Output:* Successful compile without TypeScript or syntax errors, creating an output distribution in `backend/dist`.

### 2. Verify Frontend Build (Next.js)
```bash
# Navigate to frontend folder
cd frontend

# Clean install dependencies
npm install

# Compile/Build the Next.js bundle for production
npm run build
```
*Expected Output:* Successful Static Optimization and Next.js bundle output in `frontend/.next`.

---

## 🧪 Part 2: Feature Checkup & Verification Scenarios

Use this testing scenario checklist to verify that all routing, authentication gates, and profile features work correctly:

### Scenario 1: Creator & Audience Registration & Onboarding
* **URL**: [http://localhost:3000/register](http://localhost:3000/register)
1. Navigate to `/register` and create a new **Artist / Creator** account.
2. Verify that upon clicking **Register**, you are automatically redirected to the Onboarding setup page: `/onboarding`.
3. **Important Check**: While on the onboarding setup page, look at the navigation **Header**:
   * The **PROFILE** and **MY TICKETS** buttons **must NOT be visible or clickable**.
4. Complete the setup details (Stage name, Biography, Genres, etc.) and click **COMPLETE SETUP & SAVE DETAILS**.
5. Verify that:
   * You are redirected to the events page (`/events`).
   * The navigation **Header** now displays the **PROFILE** and **MY TICKETS** buttons.
   * Clicking **PROFILE** opens your profile page (`/profile`) correctly without crashing.

---

### Scenario 2: Organizer Portal Verification & Status Gate
* **Registration URL**: [http://localhost:3000/register/organizer](http://localhost:3000/register/organizer)
* **Login URL**: [http://localhost:3000/login](http://localhost:3000/login)
1. Register a new Organizer account at `/register/organizer`.
2. Log in using the credentials you registered at `/login`.
3. Verify that:
   * You are redirected to the Organizer dashboard: `/events/organizer`.
   * Since the account is brand new, you are presented with the **"Awaiting Admin Approval" (Verification Pending)** page.
   * You cannot view, edit, or create events, scan tickets, or control live voting.
4. **Important Check**: Under the pending approval state, verify that the **Header** does *not* display organizer links, but displays a **LOG OUT** option so you can safely leave.

---

### Scenario 3: Admin CMS & Organizer Verification
* **Login URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
1. Run the following SQL queries directly in your Supabase SQL Editor to securely create your system administrator account without committing any plain-text credentials in the repository:
   ```sql
   -- 1. Create the User (Replace with your custom email and a hashed bcrypt password)
   -- (e.g. generate a bcrypt hash for your password and replace the hash below)
   INSERT INTO "User" (email, "passwordHash", "fullName", status)
   VALUES ('admin@element5.com', '$2b$10$Q7w...YOUR_HASH...', 'System Administrator', 'ACTIVE')
   RETURNING id;

   -- 2. Assign the SUPER_ADMIN role (Replace 'USER_UUID' with the ID returned above)
   INSERT INTO "RoleAssignment" ("userId", role)
   VALUES ('USER_UUID', 'SUPER_ADMIN');
   ```
2. Navigate to `/admin/login`.
3. Enter the email and password you created.
4. Click **SECURE SIGN IN**. Verify that the form dynamically transitions and requests a **Google Authenticator / 2FA Code**.
5. Enter the active 6-digit TOTP token:
   * *Note: The default Base32 2FA secret is `GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ` (you can configure a custom key via the `ADMIN_TOTP_SECRET` environment variable in Render/Railway). Add this secret to your Authenticator app to get the current code.*
6. Enter the code and click **VERIFY & SIGN IN**. Verify you are redirected to `/admin` successfully.
7. Go to the **Creators** tab in the dashboard.
8. Locate the newly registered Artist (from Scenario 1):
   * Verify they display an `UNVERIFIED` label.
   * Click **VERIFY CREATOR**. Verify that their badge changes to `✓ VERIFIED`.
9. Navigate to the **Audit Stream** under the **Overview** tab:
   * Verify that the audit log stream displays the verification action in real time.
10. Navigate to the newly created **organizers** tab:
   * Verify that newly registered organizers appear in the list with a `PENDING APPROVAL` badge.
   * Click **APPROVE ORGANIZER** -> Verify that confetti plays and the organizer is removed from the pending list.
   * Log out of the admin panel and try logging in with the newly approved organizer credentials at `/login`. Verify they are successfully redirected to `/events/organizer` instead of showing "Awaiting Admin Approval"!

---

### Scenario 4: Custom Organizer Header & Sync Tabs
* **URL**: [http://localhost:3000/login](http://localhost:3000/login)
1. Open the Database or run an SQL query in Supabase (or use the pending verification approval UI if configured) to mark your organizer account from Scenario 2 as `ACTIVE` (e.g. `UPDATE "User" SET "status" = 'ACTIVE' WHERE email = 'YOUR_ORG_EMAIL'`).
2. Log in as the Organizer.
3. Verify that:
   * You are redirected to `/events/organizer` and can view the full dashboard.
   * The **Header** navigation updates to show organizer links: **My Events**, **Registrations**, **Ticket Gateway**, **Analytics**, and **Manage Voting**.
   * The profile button is labeled **ORGANIZER PROFILE**.
4. Click on **Analytics** in the **Header**:
   * Verify that the page switches to the **Analytics** panel cleanly.
   * Verify that the URL updates to `/events/organizer?tab=analytics`.

---

### Scenario 5: Restrained Discover Page
* **URL**: [http://localhost:3000/artists](http://localhost:3000/artists)
1. Go to the **Discover Artists** page at `/artists`.
2. Search for the Artist you created in Scenario 1.
3. Verify that:
   * If they are verified, they **appear** in the directory.
   * If you revoke their verification in the admin dashboard, they **disappear** from the directory.
