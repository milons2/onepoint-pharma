require("dotenv").config();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const DB_NAME = "onepoint_pharma";
const DB_USER = "postgres";
const DB_PASS = "0330";

const BACKUP_DIR = process.env.BACKUP_PATH || "D:\\OPP_Backups";

// Generate filename: backup_onepoint_pharma_2026-02-22.sql
const now = new Date();
const dateStr = now.getFullYear() + "-" + 
                String(now.getMonth() + 1).padStart(2, '0') + "-" + 
                String(now.getDate()).padStart(2, '0');

const FILE_NAME = `backup_onepoint_pharma_${dateStr}.sql`;
const FILE_PATH = path.join(BACKUP_DIR, FILE_NAME);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// -F p means plain text SQL format
const cmd = `pg_dump -U ${DB_USER} -d ${DB_NAME} -F p -f "${FILE_PATH}"`;

console.log("📦 Starting backup...");

exec(cmd, { env: { ...process.env, PGPASSWORD: DB_PASS } }, (err) => {
  if (err) {
    console.error("❌ Backup failed:", err.message);
  } else {
    console.log("✅ Backup saved:", FILE_PATH);
  }
});