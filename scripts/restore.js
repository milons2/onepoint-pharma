require("dotenv").config();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// ================= CONFIG =================
const DB_NAME = "onepoint_pharma";
const DB_USER = "postgres";
const DB_PASS = "0330";

// PostgreSQL bin path from .env
const PG_BIN = process.env.PG_BIN_PATH || "C:\\Program Files\\PostgreSQL\\16\\bin";

// Backup folder
const BACKUP_DIR = process.env.BACKUP_PATH || "D:\\OPP_Backups";

// ==========================================

// Find latest backup file
function getLatestBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log("❌ Backup folder not found:", BACKUP_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".sql"))
    .map(f => ({
      name: f,
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time);

  if (!files.length) {
    console.log("❌ No backup files found.");
    process.exit(1);
  }

  return path.join(BACKUP_DIR, files[0].name);
}

const latestBackup = getLatestBackup();
console.log("📦 Latest backup found:", latestBackup);

// Full pg_restore command
const restoreCmd = `"${PG_BIN}\\psql.exe" -U ${DB_USER} -d ${DB_NAME} -f "${latestBackup}"`;

console.log("⚠️ Starting restore...");
console.log("Database will be overwritten!");

// Run restore
exec(
  restoreCmd,
  {
    env: { ...process.env, PGPASSWORD: DB_PASS },
  },
  (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Restore failed:", err.message);
      return;
    }

    console.log("✅ Restore completed successfully!");
    console.log(stdout);
  }
);