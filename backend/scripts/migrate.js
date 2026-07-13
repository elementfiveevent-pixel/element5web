const path = require("path");
// Load environment variables from the parent directory's .env file
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { Client } = require("pg");
const fs = require("fs");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ Error: DATABASE_URL environment variable is not defined.");
    process.exit(1);
  }

  console.log("⏳ Connecting to PostgreSQL database...");
  const useSsl = connectionString.includes("supabase.co") || connectionString.includes("supabase.com");
  const client = new Client({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  });
  
  try {
    await client.connect();
    console.log("✅ Connected successfully!");

    const schemaPath = path.join(__dirname, "schema.sql");
    console.log(`⏳ Reading DDL schema from ${schemaPath}...`);
    const sql = fs.readFileSync(schemaPath, "utf8");

    console.log("⏳ Executing SQL schema statements...");
    await client.query(sql);
    console.log("🚀 SQL schema execution finished successfully!");

    console.log("⏳ Checking and seeding initial users...");
    
    const now = new Date();

    // 1. Super Admin
    const adminEmail = "admin@element5.com";
    let adminUserId;
    const adminCheck = await client.query('SELECT id FROM "User" WHERE email = $1', [adminEmail]);
    if (adminCheck.rows.length === 0) {
      console.log("🌱 Seeding Super Admin...");
      const adminHash = await bcrypt.hash("Element5AdminSecure2026!", 10);
      adminUserId = crypto.randomUUID();
      await client.query(
        'INSERT INTO "User" (id, email, "passwordHash", "fullName", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [adminUserId, adminEmail, adminHash, "Super Admin", now, now]
      );
    } else {
      adminUserId = adminCheck.rows[0].id;
    }
    await client.query(
      'INSERT INTO "RoleAssignment" (id, "userId", role, "createdAt") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", role) DO NOTHING',
      [crypto.randomUUID(), adminUserId, "SUPER_ADMIN", now]
    );

    // 2. Event Organizer
    const orgEmail = "organizer@element5.com";
    let orgUserId;
    const orgCheck = await client.query('SELECT id FROM "User" WHERE email = $1', [orgEmail]);
    if (orgCheck.rows.length === 0) {
      console.log("🌱 Seeding Event Organizer...");
      const orgHash = await bcrypt.hash("Element5CreatorPass2026!", 10);
      orgUserId = crypto.randomUUID();
      await client.query(
        'INSERT INTO "User" (id, email, "passwordHash", "fullName", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [orgUserId, orgEmail, orgHash, "Event Organizer", now, now]
      );
    } else {
      orgUserId = orgCheck.rows[0].id;
    }
    await client.query(
      'INSERT INTO "RoleAssignment" (id, "userId", role, "createdAt") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", role) DO NOTHING',
      [crypto.randomUUID(), orgUserId, "ORG_ADMIN", now]
    );

    await client.query(
      'DELETE FROM "RoleAssignment" WHERE "userId" = $1 AND role = $2',
      [orgUserId, "ARTIST"]
    );

    // 3. Artist Profile
    const artistEmail = "artist1@element5.com";
    let artistUserId;
    const artistCheck = await client.query('SELECT id FROM "User" WHERE email = $1', [artistEmail]);
    if (artistCheck.rows.length === 0) {
      console.log("🌱 Seeding Artist...");
      const artistHash = await bcrypt.hash("Element5CreatorPass2026!", 10);
      artistUserId = crypto.randomUUID();
      await client.query(
        'INSERT INTO "User" (id, email, "passwordHash", "fullName", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [artistUserId, artistEmail, artistHash, "DJ Zenith", now, now]
      );
    } else {
      artistUserId = artistCheck.rows[0].id;
    }
    await client.query(
      'INSERT INTO "RoleAssignment" (id, "userId", role, "createdAt") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", role) DO NOTHING',
      [crypto.randomUUID(), artistUserId, "ARTIST", now]
    );
    
    // Ensure Artist Profile exists
    const profileCheck = await client.query('SELECT id FROM "ArtistProfile" WHERE "userId" = $1', [artistUserId]);
    if (profileCheck.rows.length === 0) {
      await client.query(
        'INSERT INTO "ArtistProfile" (id, "userId", "stageName", biography, genres, skills, languages, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [crypto.randomUUID(), artistUserId, "DJ Zenith", "Electronic music producer and battle master.", ["Electronic", "Dance"], ["DJing", "Beatmaking"], ["English"], now, now]
      );
    }

    console.log("🎉 Database migration and seeding completed successfully!");

  } catch (err) {
    console.error("❌ Migration error:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
