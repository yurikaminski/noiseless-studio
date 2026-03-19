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

    CREATE TABLE IF NOT EXISTS video_cards (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title        TEXT NOT NULL DEFAULT 'Untitled Video',
      description  TEXT,
      stage        TEXT NOT NULL DEFAULT 'ideas',
      ideas_notes  TEXT,
      script       TEXT,
      review_notes TEXT,
      published_at DATETIME,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS video_card_links (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id    INTEGER NOT NULL REFERENCES video_cards(id) ON DELETE CASCADE,
      url        TEXT NOT NULL,
      title      TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS video_card_scenes (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id       INTEGER NOT NULL REFERENCES video_cards(id) ON DELETE CASCADE,
      order_index   INTEGER NOT NULL DEFAULT 0,
      description   TEXT,
      narration     TEXT,
      start_time    TEXT DEFAULT '00:00',
      end_time      TEXT DEFAULT '00:00',
      visual_notes  TEXT,
      video_prompt  TEXT,
      frame_a_url   TEXT,
      frame_b_url   TEXT,
      video_url     TEXT,
      status        TEXT DEFAULT 'pending',
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL DEFAULT 'Noiseless Studio',
      domain     TEXT,
      type       TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id         INTEGER REFERENCES organizations(id),
      google_id      TEXT UNIQUE,
      email          TEXT NOT NULL UNIQUE,
      name           TEXT,
      avatar_url     TEXT,
      password_hash  TEXT,
      email_verified INTEGER NOT NULL DEFAULT 0,
      role           TEXT NOT NULL DEFAULT 'creator',
      is_active      INTEGER NOT NULL DEFAULT 1,
      created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at  DATETIME
    );

    CREATE TABLE IF NOT EXISTS email_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token      TEXT NOT NULL UNIQUE,
      type       TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at    DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS org_access_requests (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      org_id     INTEGER NOT NULL REFERENCES organizations(id),
      status     TEXT NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}
