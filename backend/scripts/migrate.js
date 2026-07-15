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
    console.log("🎉 Database migration completed successfully!");

  } catch (err) {
    console.error("❌ Migration error:", err.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
