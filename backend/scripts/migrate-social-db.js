const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("DATABASE_URL is not set in backend/.env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes("supabase.co") || dbUrl.includes("supabase.com") ? { rejectUnauthorized: false } : undefined,
});

async function runMigration() {
  console.log("Connecting to PostgreSQL...");
  const client = await pool.connect();
  try {
    console.log("Applying schema alterations for community / social posts...");
    
    // Add columns to Community
    await client.query(`
      ALTER TABLE "Community" 
      ADD COLUMN IF NOT EXISTS "createdById" UUID REFERENCES "User"("id") ON DELETE SET NULL;
    `);
    console.log("✓ 'createdById' added to 'Community' table");

    // Add columns to CommunityMember
    await client.query(`
      ALTER TABLE "CommunityMember" 
      ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'MEMBER';
    `);
    console.log("✓ 'role' added to 'CommunityMember' table");

    // Add columns to Post
    await client.query(`
      ALTER TABLE "Post" 
      ADD COLUMN IF NOT EXISTS "title" TEXT;
    `);
    console.log("✓ 'title' added to 'Post' table");

    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
