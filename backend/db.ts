import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// In production (Railway) set DATA_DIR=/data (persistent volume).
// Locally falls back to the backend directory — no change needed.
const dataDir = process.env.DATA_DIR || __dirname;

export async function openDb() {
  return open({
    filename: path.join(dataDir, 'database.sqlite'),
    driver: sqlite3.Database,
  });
}

export async function initDb() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt    TEXT NOT NULL,
      title     TEXT NOT NULL,
      filename  TEXT NOT NULL,
      type      TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      name                      TEXT NOT NULL,
      type                      TEXT DEFAULT 'spreadsheet',
      description               TEXT,
      drive_parent_folder_id    TEXT,
      spreadsheet_source        TEXT,
      spreadsheet_path          TEXT,
      video_duration            TEXT DEFAULT '8',
      video_resolution          TEXT DEFAULT '720p',
      created_at                DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id         INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      row_index          INTEGER,
      time               TEXT,
      script             TEXT,
      voice_over         TEXT,
      emotion            TEXT,
      idea               TEXT,
      shot_type          TEXT,
      roll_type          TEXT,
      frame_a_prompt     TEXT,
      frame_b_prompt     TEXT,
      video_prompt       TEXT,
      text_overlay       TEXT,
      sound_design       TEXT,
      camera_movement    TEXT,
      music_intensity    TEXT,
      status             TEXT DEFAULT 'Fazer nada',
      drive_link         TEXT,
      processing_status  TEXT DEFAULT 'idle',
      error_message      TEXT,
      created_at         DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}
