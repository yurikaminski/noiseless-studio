import { openDb } from './db.js';
import type { Scene, SpreadsheetRow } from './types.js';

// ── Generations ───────────────────────────────────────────────────────────────
export async function getAllGenerations() {
  const db = await openDb();
  return db.all('SELECT * FROM generations ORDER BY timestamp DESC');
}

export async function createGeneration(prompt: string, title: string, filename: string, type: string) {
  const db = await openDb();
  const result = await db.run(
    'INSERT INTO generations (prompt, title, filename, type) VALUES (?, ?, ?, ?)',
    [prompt, title, filename, type]
  );
  return result.lastID;
}

export async function updateGenerationFilename(id: number, filename: string) {
  const db = await openDb();
  await db.run('UPDATE generations SET filename = ? WHERE id = ?', [filename, id]);
}

export async function deleteGeneration(id: number) {
  const db = await openDb();
  await db.run('DELETE FROM generations WHERE id = ?', [id]);
}

// ── Projects ──────────────────────────────────────────────────────────────────
export async function getAllProjects() {
  const db = await openDb();
  return db.all('SELECT * FROM projects ORDER BY created_at DESC');
}

export async function getProjectById(id: number) {
  const db = await openDb();
  return db.get('SELECT * FROM projects WHERE id = ?', [id]);
}

export async function createProject(data: {
  name: string;
  type?: string;
  description?: string;
  drive_parent_folder_id?: string;
  spreadsheet_source?: string;
  spreadsheet_path?: string;
  video_duration?: string;
  video_resolution?: string;
}) {
  const db = await openDb();
  const result = await db.run(
    `INSERT INTO projects (name, type, description, drive_parent_folder_id, spreadsheet_source, spreadsheet_path, video_duration, video_resolution)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.name,
      data.type ?? 'spreadsheet',
      data.description ?? null,
      data.drive_parent_folder_id ?? null,
      data.spreadsheet_source ?? null,
      data.spreadsheet_path ?? null,
      data.video_duration ?? '5',
      data.video_resolution ?? '720p',
    ]
  );
  return result.lastID as number;
}

export async function updateProject(id: number, data: Partial<{
  name: string;
  description: string;
  drive_parent_folder_id: string;
  video_duration: string;
  video_resolution: string;
}>) {
  const db = await openDb();
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(data), id];
  await db.run(`UPDATE projects SET ${sets} WHERE id = ?`, values);
}

export async function deleteProject(id: number) {
  const db = await openDb();
  await db.run('DELETE FROM projects WHERE id = ?', [id]);
}

// ── Scenes ────────────────────────────────────────────────────────────────────
export async function getScenesByProject(projectId: number) {
  const db = await openDb();
  return db.all('SELECT * FROM scenes WHERE project_id = ? ORDER BY row_index ASC', [projectId]);
}

export async function getSceneById(id: number) {
  const db = await openDb();
  return db.get('SELECT * FROM scenes WHERE id = ?', [id]);
}

export async function createScenes(projectId: number, rows: SpreadsheetRow[]) {
  const db = await openDb();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    await db.run(
      `INSERT INTO scenes
        (project_id, row_index, time, script, voice_over, emotion, idea, shot_type, roll_type,
         frame_a_prompt, frame_b_prompt, video_prompt, text_overlay, sound_design,
         camera_movement, music_intensity, status, drive_link)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId, i,
        row.time ?? null, row.script ?? null, row.voice_over ?? null,
        row.emotion ?? null, row.idea ?? null, row.shot_type ?? null,
        row.roll_type ?? null, row.frame_a_prompt ?? null, row.frame_b_prompt ?? null,
        row.video_prompt ?? null, row.text_overlay ?? null, row.sound_design ?? null,
        row.camera_movement ?? null, row.music_intensity ?? null,
        row.status ?? 'Fazer nada', row.drive_link ?? null,
      ]
    );
  }
}

export async function updateScene(id: number, data: Partial<Scene>) {
  const db = await openDb();
  const allowed = ['status', 'drive_link', 'processing_status', 'error_message',
                   'frame_a_prompt', 'frame_b_prompt', 'video_prompt'];
  const filtered = Object.fromEntries(
    Object.entries(data).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(filtered).length === 0) return;
  const sets = Object.keys(filtered).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(filtered), id];
  await db.run(`UPDATE scenes SET ${sets} WHERE id = ?`, values);
}
