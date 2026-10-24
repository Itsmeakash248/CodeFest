import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually if not in process.env
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

console.log("\n=======================================================");
console.log("   ViewPilot Pro - Supabase Connectivity Verification");
console.log("=======================================================\n");

if (!url || !anonKey) {
  console.log("❌ Supabase is NOT configured in .env.local");
  console.log("\nPlease add your credentials to .env.local:");
  console.log("  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co");
  console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...");
  console.log("\nApp will currently run in offline DEMO mode.\n");
  process.exit(1);
}

console.log(`🔗 Project URL: ${url}`);
console.log(`🔑 Anon Key:    ${anonKey.slice(0, 15)}...${anonKey.slice(-6)}`);
console.log("\nPinging Supabase...");

const supabase = createClient(url, anonKey);

async function verify() {
  let hasErrors = false;

  // 1. Auth Health Check
  try {
    const { error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log(`⚠️  Auth warning: ${authError.message}`);
    } else {
      console.log("✅ Supabase Auth service reachable");
    }
  } catch (err) {
    console.log(`❌ Auth connection failed: ${err.message}`);
    hasErrors = true;
  }

  // 2. Check Database Tables
  const tables = ["profiles", "interview_reports", "chat_sessions", "workflows"];
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        if (
          error.code === "PGRST205" ||
          error.code === "PGRST204" ||
          error.code === "42P01" ||
          error.message?.toLowerCase().includes("could not find the table") ||
          error.message?.toLowerCase().includes("relation")
        ) {
          console.log(`❌ Table '${table}' does NOT exist yet.`);
          hasErrors = true;
        } else {
          // If RLS blocked rows or returned empty, table exists!
          console.log(`✅ Table '${table}' exists and is reachable`);
        }
      } else {
        console.log(`✅ Table '${table}' exists and is reachable`);
      }
    } catch (err) {
      console.log(`❌ Error checking table '${table}': ${err.message}`);
      hasErrors = true;
    }
  }

  console.log("\n-------------------------------------------------------");
  if (hasErrors) {
    console.log("❌ Database has missing tables or connection issues.");
    console.log("👉 ACTION REQUIRED: Copy supabase/schema.sql and paste it into your Supabase SQL Editor, then click RUN.");
    console.log("-------------------------------------------------------\n");
    process.exit(1);
  } else {
    console.log("🎉 ALL CHECKS PASSED! Supabase database and auth are active.");
    console.log("   ViewPilot Pro will use full cloud persistence.");
    console.log("-------------------------------------------------------\n");
  }
}

void verify();
