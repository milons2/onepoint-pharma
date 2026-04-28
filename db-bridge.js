const { ipcMain } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

const BACKUP_DIR = "D:\\OPP_Backups";

function setupDatabaseHandlers(scriptsPath) {
  // 1. Manual Backup
  ipcMain.handle("db-manual-backup", async () => {
    return new Promise((resolve, reject) => {
      exec(`node "${path.join(scriptsPath, "backup.js")}"`, (err) => {
        if (err) reject(err.message);
        else resolve("Backup Success!");
      });
    });
  });

  // 2. Manual Restore
  ipcMain.handle("db-manual-restore", async () => {
    return new Promise((resolve, reject) => {
      exec(`node "${path.join(scriptsPath, "restore.js")}"`, (err) => {
        if (err) reject(err.message);
        else resolve("Restore Success!");
      });
    });
  });

  // 3. History List
  ipcMain.handle("get-backup-history", async () => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) return [];
      return fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith(".sql"))
        .map(f => ({
          name: f,
          size: (fs.statSync(path.join(BACKUP_DIR, f)).size / 1024 / 1024).toFixed(2) + " MB",
          createdAt: fs.statSync(path.join(BACKUP_DIR, f)).mtime
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) { return []; }
  });
}

module.exports = { setupDatabaseHandlers };