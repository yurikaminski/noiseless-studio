import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDb, openDb } from './db.js';
import * as q from './query_db.js';
import { GenerationMode } from './types.js';
import { generateImageFromPrompt, generateImage, generateVideoForScene, enhancePrompt, generateScript } from './services/geminiService.js';
import { loadOAuthClient, getAuthUrl, exchangeCode, getConnectedClient, getConnectedEmail } from './services/authService.js';
import * as drive from './services/driveService.js';
import { extractSheetId, readSheets, updateDriveLink } from './services/sheetsService.js';
import { parseXLSX, parseCSV } from './services/xlsxService.js';
import userAuthRouter from './routes/userAuthRoutes.js';
import orgRouter from './routes/orgRoutes.js';
import { requireAuth } from './middleware/requireAuth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Prevent unhandled rejections from crashing the process silently
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

// Runtime-overridable API key (set via /api/config/apikey)
let runtimeApiKey: string | undefined;

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

app.use(express.json());
app.use(cookieParser());

// CORS — allow Vercel frontend (and localhost during dev)
app.use((req, res, next) => {
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());
  const origin = req.headers.origin;
  if (origin && allowedOrigins.some(a => origin === a || origin.startsWith(a))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});

// Uploads dir — in production set DATA_DIR=/data (Railway volume), falls back locally
const uploadsDir = path.join(process.env.DATA_DIR || __dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer setup
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// ── Health check (public) ─────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ── Public auth routes (no session required) ──────────────────────────────────
app.use('/api/user', userAuthRouter);
app.use('/api/org', orgRouter);

// ── Auth wall — everything below requires a valid session ─────────────────────
app.use(requireAuth);

// ── SSE ───────────────────────────────────────────────────────────────────────
const sseClients = new Map<string, express.Response[]>();

function sendSSE(projectId: string, event: string, data: unknown) {
  const clients = sseClients.get(projectId) || [];
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

app.get('/api/events/:projectId', (req, res) => {
  const { projectId } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const list = sseClients.get(projectId) || [];
  list.push(res);
  sseClients.set(projectId, list);

  req.on('close', () => {
    const remaining = (sseClients.get(projectId) || []).filter(r => r !== res);
    sseClients.set(projectId, remaining);
  });
});

// ── Config ────────────────────────────────────────────────────────────────────
app.post('/api/config/apikey', (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== 'string') {
    res.status(400).json({ error: 'apiKey is required' });
    return;
  }
  runtimeApiKey = apiKey;
  res.json({ success: true });
});

// ── Enhance Prompt ────────────────────────────────────────────────────────────
app.post('/api/enhance-prompt', async (req, res) => {
  const { prompt, type } = req.body;
  const apiKey = runtimeApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(400).json({ error: 'API key not configured. Set it in Settings.' });
    return;
  }
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }
  try {
    const enhanced = await enhancePrompt(prompt, type || 'text-to-video', apiKey);
    res.json({ enhanced });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Enhancement failed' });
  }
});

// ── Generations ───────────────────────────────────────────────────────────────
app.get('/api/generations', async (_req, res) => {
  try {
    const gens = await q.getAllGenerations();
    res.json(gens);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/generations/:id', async (req, res) => {
  try {
    await q.deleteGeneration(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Quick Gen ─────────────────────────────────────────────────────────────────
app.post('/api/quick-gen', upload.fields([
  { name: 'startFrame', maxCount: 1 },
  { name: 'endFrame', maxCount: 1 },
  { name: 'references', maxCount: 10 },
]), async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  const {
    prompt, type,
    videoModel, imageModel,
    aspectRatio, resolution, generateSound, duration,
  } = req.body;

  const apiKey = runtimeApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(400).json({ error: 'API key not configured. Set it in Settings.' });
    return;
  }
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    if (type === 'text-to-image') {
      const model = imageModel || 'gemini-3.1-flash-image-preview';
      const refs = (files?.['references'] || []).map(f => ({
        buffer: fs.readFileSync(f.path),
        mimeType: f.mimetype,
      }));

      const result = await generateImage(
        prompt, apiKey, model,
        aspectRatio || '16:9',
        refs.length > 0 ? refs : undefined
      );

      const ext = result.mimeType.includes('jpeg') ? 'jpg' : 'png';
      const filename = `${Date.now()}-gen.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, filename), result.buffer);

      await q.createGeneration(prompt, prompt.slice(0, 60), filename, 'image');
      res.json({ type: 'image', url: `/uploads/${filename}`, mimeType: result.mimeType });

    } else {
      // Video generation
      const model = videoModel || 'veo-3.1-generate-preview';
      let mode = GenerationMode.TEXT_TO_VIDEO;
      let startFrameBuffer: Buffer | null = null;
      let startFrameMimeType: string | undefined;
      let endFrameBuffer: Buffer | null = null;
      let endFrameMimeType: string | undefined;

      if (type === 'frames-to-video') {
        mode = GenerationMode.FRAMES_TO_VIDEO;
        const sf = files?.['startFrame']?.[0];
        const ef = files?.['endFrame']?.[0];
        if (sf) { startFrameBuffer = fs.readFileSync(sf.path); startFrameMimeType = sf.mimetype; }
        if (ef) { endFrameBuffer = fs.readFileSync(ef.path); endFrameMimeType = ef.mimetype; }
      } else if (type === 'references-to-video') {
        mode = GenerationMode.REFERENCES_TO_VIDEO;
        const rf = files?.['references']?.[0];
        if (rf) { startFrameBuffer = fs.readFileSync(rf.path); startFrameMimeType = rf.mimetype; }
      }

      const videoBuffer = await generateVideoForScene({
        prompt,
        model: model as any,
        aspectRatio: (aspectRatio || '16:9') as any,
        resolution: (resolution || '720p') as any,
        duration: (duration || '8') as any,
        mode,
        startFrameBuffer,
        startFrameMimeType,
        endFrameBuffer,
        endFrameMimeType,
        generateSound: generateSound === 'true',
      }, apiKey);

      const filename = `${Date.now()}-gen.mp4`;
      fs.writeFileSync(path.join(uploadsDir, filename), videoBuffer);

      await q.createGeneration(prompt, prompt.slice(0, 60), filename, 'video');
      res.json({ type: 'video', url: `/uploads/${filename}`, mimeType: 'video/mp4' });
    }
  } catch (err: any) {
    console.error('[quick-gen] error:', err);
    res.status(500).json({ error: err.message || 'Generation failed' });
  }
});

// ── Auth (Google Drive / Sheets) ─────────────────────────────────────────────
app.get('/api/auth/google', async (req, res) => {
  const client = await loadOAuthClient();
  if (!client) { res.status(500).json({ error: 'OAuth client not configured' }); return; }
  const url = getAuthUrl(client);
  res.redirect(url);
});

app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) { res.status(400).send('Missing code'); return; }
  const client = await loadOAuthClient();
  if (!client) { res.status(500).send('OAuth client not configured'); return; }
  await exchangeCode(client, code);
  res.send('<script>window.close()</script>Connected! You can close this tab.');
});

app.get('/api/auth/status', async (req, res) => {
  const client = await getConnectedClient();
  if (!client) { res.json({ connected: false }); return; }
  const email = getConnectedEmail(client);
  res.json({ connected: true, email });
});

// ── Projects ──────────────────────────────────────────────────────────────────
app.get('/api/projects', async (_req, res) => {
  try {
    res.json(await q.getAllProjects());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const id = await q.createProject(req.body);
    const project = await q.getProjectById(id);
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await q.getProjectById(Number(req.params.id));
    if (!project) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await q.deleteProject(Number(req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Import from local .xlsx / .csv
app.post('/api/projects/import/local', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) { res.status(400).json({ error: 'No file uploaded' }); return; }

  try {
    const {
      name, description, drive_parent_folder_id,
      video_duration, video_resolution,
    } = req.body;

    const ext = path.extname(file.originalname).toLowerCase();
    const rows = ext === '.csv' ? parseCSV(file.path) : parseXLSX(file.path);

    const projectId = await q.createProject({
      name: name || file.originalname,
      type: 'spreadsheet',
      description,
      drive_parent_folder_id,
      spreadsheet_source: 'local',
      spreadsheet_path: file.path,
      video_duration,
      video_resolution,
    });

    await q.createScenes(projectId, rows);

    const project = await q.getProjectById(projectId);
    const scenes = await q.getScenesByProject(projectId);
    res.json({ project, scenes });
  } catch (err: any) {
    console.error('[import/local] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Import from Google Sheets URL
app.post('/api/projects/import/sheets', async (req, res) => {
  const {
    sheets_url: sheetsUrl,
    name, description, drive_parent_folder_id,
    video_duration, video_resolution,
  } = req.body;

  if (!sheetsUrl) { res.status(400).json({ error: 'sheets_url is required' }); return; }

  const client = await getConnectedClient();
  if (!client) { res.status(401).json({ error: 'Google Drive not connected' }); return; }

  try {
    const spreadsheetId = extractSheetId(sheetsUrl);
    const rows = await readSheets(spreadsheetId, client);

    const projectId = await q.createProject({
      name: name || 'Google Sheets Import',
      type: 'spreadsheet',
      description,
      drive_parent_folder_id,
      spreadsheet_source: 'sheets',
      spreadsheet_path: spreadsheetId,
      video_duration,
      video_resolution,
    });

    await q.createScenes(projectId, rows);

    const project = await q.getProjectById(projectId);
    const scenes = await q.getScenesByProject(projectId);
    res.json({ project, scenes });
  } catch (err: any) {
    console.error('[import/sheets] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Scenes ────────────────────────────────────────────────────────────────────
app.get('/api/projects/:id/scenes', async (req, res) => {
  try {
    res.json(await q.getScenesByProject(Number(req.params.id)));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/scenes/:id', async (req, res) => {
  try {
    await q.updateScene(Number(req.params.id), req.body);
    const scene = await q.getSceneById(Number(req.params.id));
    res.json(scene);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Process Scene ─────────────────────────────────────────────────────────────
async function processScene(sceneId: number, projectId: number) {
  const apiKey = runtimeApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('API key not configured');

  const scene = await q.getSceneById(sceneId);
  const project = await q.getProjectById(projectId);
  if (!scene || !project) throw new Error('Scene or project not found');

  const emit = (event: string, data: unknown) => sendSSE(String(projectId), event, data);

  await q.updateScene(sceneId, { processing_status: 'processing' });
  const updatingScene = await q.getSceneById(sceneId);
  sendSSE(String(projectId), 'scene_update', updatingScene);

  if (scene.status === 'Criar imagem') {
    const driveClient = await getConnectedClient();
    if (!driveClient) throw new Error('Google Drive not connected');

    const parentFolderId = project.drive_parent_folder_id;
    if (!parentFolderId) throw new Error('Drive parent folder not configured');

    const folderName = `Cena_${String(scene.row_index + 1).padStart(3, '0')}`;
    emit('progress', { message: `Creating folder: ${folderName}` });

    const folder = await drive.createSubfolder(parentFolderId, folderName, driveClient);
    await q.updateScene(sceneId, { drive_link: folder.webViewLink });

    // Write-back to Google Sheets if applicable
    if (project.spreadsheet_source === 'sheets' && project.spreadsheet_path) {
      await updateDriveLink(project.spreadsheet_path, scene.row_index, folder.webViewLink, driveClient).catch(() => {});
    }

    if (scene.frame_a_prompt) {
      emit('progress', { message: 'Generating Frame A...' });
      const imgA = await generateImageFromPrompt(scene.frame_a_prompt, apiKey);
      await drive.uploadFile(folder.id, 'Frame A.png', imgA.buffer, imgA.mimeType, driveClient);
    }

    if (scene.frame_b_prompt) {
      emit('progress', { message: 'Generating Frame B...' });
      const imgB = await generateImageFromPrompt(scene.frame_b_prompt, apiKey);
      await drive.uploadFile(folder.id, 'Frame B.png', imgB.buffer, imgB.mimeType, driveClient);
    }

    await q.updateScene(sceneId, { processing_status: 'done' });

  } else if (scene.status === 'Criar vídeo') {
    const driveClient = await getConnectedClient();
    if (!driveClient) throw new Error('Google Drive not connected');
    if (!scene.drive_link) throw new Error('Drive link not set — run "Criar imagem" first');

    const folderId = drive.extractFolderIdFromLink(scene.drive_link);
    const images = await drive.listImages(folderId, driveClient);

    if (images.length === 0) throw new Error('No images found in Drive folder');

    let startFrameBuffer: Buffer | null = null;
    let startFrameMimeType = 'image/png';
    let endFrameBuffer: Buffer | null = null;
    let endFrameMimeType = 'image/png';

    if (images.length === 1) {
      startFrameBuffer = await drive.downloadFile(images[0].id, driveClient);
    } else {
      const frameA = images.find(i => i.name.includes('Frame A')) || images[0];
      const frameB = images.find(i => i.name.includes('Frame B')) || images[1];
      startFrameBuffer = await drive.downloadFile(frameA.id, driveClient);
      endFrameBuffer = await drive.downloadFile(frameB.id, driveClient);
    }

    emit('progress', { message: 'Generating video...' });

    const videoBuffer = await generateVideoForScene({
      prompt: scene.video_prompt || '',
      model: 'veo-3.1-generate-preview' as any,
      aspectRatio: '16:9' as any,
      resolution: (project.video_resolution || '720p') as any,
      duration: (project.video_duration || '8') as any,
      mode: GenerationMode.FRAMES_TO_VIDEO,
      startFrameBuffer,
      startFrameMimeType,
      endFrameBuffer,
      endFrameMimeType,
      generateSound: false,
    }, apiKey);

    await drive.uploadFile(folderId, 'video.mp4', videoBuffer, 'video/mp4', driveClient);
    await q.updateScene(sceneId, { processing_status: 'done' });

  } else {
    await q.updateScene(sceneId, { processing_status: 'idle' });
  }

  const doneScene = await q.getSceneById(sceneId);
  sendSSE(String(projectId), 'scene_update', doneScene);
  sendSSE(String(projectId), 'scene_done', { sceneId });
}

app.post('/api/scenes/:id/process', async (req, res) => {
  const sceneId = Number(req.params.id);
  const scene = await q.getSceneById(sceneId);
  if (!scene) { res.status(404).json({ error: 'Scene not found' }); return; }

  // Respond immediately; processing runs in background
  res.json({ started: true });

  processScene(sceneId, scene.project_id).catch(async (err: Error) => {
    console.error(`[processScene] scene ${sceneId}:`, err);
    await q.updateScene(sceneId, { processing_status: 'error', error_message: err.message });
    const errScene = await q.getSceneById(sceneId);
    sendSSE(String(scene.project_id), 'scene_update', errScene);
    sendSSE(String(scene.project_id), 'scene_error', { sceneId, error: err.message });
  });
});

// Batch process
app.post('/api/projects/:id/process/batch', async (req, res) => {
  const projectId = Number(req.params.id);
  const { status_filter: status } = req.body;

  const scenes = await q.getScenesByProject(projectId);
  const toProcess = status
    ? scenes.filter((s: any) => s.status === status)
    : scenes.filter((s: any) => s.status !== 'Fazer nada');

  res.json({ queued: toProcess.length });

  for (const scene of toProcess) {
    await processScene(scene.id, projectId).catch(async (err: Error) => {
      console.error(`[batch] scene ${scene.id}:`, err);
      await q.updateScene(scene.id, { processing_status: 'error', error_message: err.message });
      const errScene = await q.getSceneById(scene.id);
      sendSSE(String(projectId), 'scene_update', errScene);
    });
  }

  sendSSE(String(projectId), 'batch_done', {});
});

// ── Video Cards ───────────────────────────────────────────────────────────────

app.get('/api/projects/:id/cards', async (req, res) => {
  const db = await openDb();
  const cards = await db.all(
    'SELECT * FROM video_cards WHERE project_id = ? ORDER BY created_at ASC',
    [Number(req.params.id)]
  );
  res.json(cards);
});

app.post('/api/projects/:id/cards', async (req, res) => {
  const db = await openDb();
  const { title = 'Untitled Video', stage = 'ideas' } = req.body;
  const result = await db.run(
    'INSERT INTO video_cards (project_id, title, stage) VALUES (?, ?, ?)',
    [Number(req.params.id), title, stage]
  );
  const card = await db.get('SELECT * FROM video_cards WHERE id = ?', [result.lastID]);
  res.status(201).json(card);
});

app.get('/api/cards/:id', async (req, res) => {
  const db = await openDb();
  const id = Number(req.params.id);
  const card = await db.get('SELECT * FROM video_cards WHERE id = ?', [id]);
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }
  const links = await db.all('SELECT * FROM video_card_links WHERE card_id = ? ORDER BY created_at ASC', [id]);
  const scenes = await db.all('SELECT * FROM video_card_scenes WHERE card_id = ? ORDER BY order_index ASC', [id]);
  res.json({ ...card, links, scenes });
});

app.put('/api/cards/:id', async (req, res) => {
  const db = await openDb();
  const id = Number(req.params.id);
  const allowed = ['title', 'description', 'stage', 'ideas_notes', 'script', 'review_notes', 'published_at'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) { res.json({ ok: true }); return; }
  const setClauses = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f]);
  await db.run(
    `UPDATE video_cards SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...values, id]
  );
  const card = await db.get('SELECT * FROM video_cards WHERE id = ?', [id]);
  res.json(card);
});

app.delete('/api/cards/:id', async (req, res) => {
  const db = await openDb();
  await db.run('DELETE FROM video_cards WHERE id = ?', [Number(req.params.id)]);
  res.json({ ok: true });
});

// ── Card Links ────────────────────────────────────────────────────────────────

app.post('/api/cards/:id/links', async (req, res) => {
  const db = await openDb();
  const { url, title = '' } = req.body;
  if (!url) { res.status(400).json({ error: 'url is required' }); return; }
  const result = await db.run(
    'INSERT INTO video_card_links (card_id, url, title) VALUES (?, ?, ?)',
    [Number(req.params.id), url, title]
  );
  const link = await db.get('SELECT * FROM video_card_links WHERE id = ?', [result.lastID]);
  res.status(201).json(link);
});

app.delete('/api/cards/links/:linkId', async (req, res) => {
  const db = await openDb();
  await db.run('DELETE FROM video_card_links WHERE id = ?', [Number(req.params.linkId)]);
  res.json({ ok: true });
});

// ── Card Scenes ───────────────────────────────────────────────────────────────

app.post('/api/cards/:id/scenes', async (req, res) => {
  const db = await openDb();
  const cardId = Number(req.params.id);
  const maxRow = await db.get(
    'SELECT MAX(order_index) as mx FROM video_card_scenes WHERE card_id = ?', [cardId]
  );
  const nextIndex = (maxRow?.mx ?? -1) + 1;
  const result = await db.run(
    'INSERT INTO video_card_scenes (card_id, order_index) VALUES (?, ?)',
    [cardId, nextIndex]
  );
  const scene = await db.get('SELECT * FROM video_card_scenes WHERE id = ?', [result.lastID]);
  res.status(201).json(scene);
});

app.put('/api/cards/scenes/:sceneId', async (req, res) => {
  const db = await openDb();
  const id = Number(req.params.sceneId);
  const allowed = ['description', 'narration', 'start_time', 'end_time', 'visual_notes',
    'video_prompt', 'frame_a_url', 'frame_b_url', 'video_url', 'status', 'order_index'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) { res.json({ ok: true }); return; }
  const setClauses = fields.map(f => `${f} = ?`).join(', ');
  const values = fields.map(f => req.body[f]);
  await db.run(`UPDATE video_card_scenes SET ${setClauses} WHERE id = ?`, [...values, id]);
  const scene = await db.get('SELECT * FROM video_card_scenes WHERE id = ?', [id]);
  res.json(scene);
});

app.delete('/api/cards/scenes/:sceneId', async (req, res) => {
  const db = await openDb();
  await db.run('DELETE FROM video_card_scenes WHERE id = ?', [Number(req.params.sceneId)]);
  res.json({ ok: true });
});

// ── Generate Script ───────────────────────────────────────────────────────────

app.post('/api/cards/:id/generate-script', async (req, res) => {
  const db = await openDb();
  const id = Number(req.params.id);
  const apiKey = runtimeApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(400).json({ error: 'API key not configured.' }); return; }
  const card = await db.get('SELECT ideas_notes FROM video_cards WHERE id = ?', [id]);
  if (!card) { res.status(404).json({ error: 'Card not found' }); return; }
  const notesText = (() => {
    if (!card.ideas_notes) return '';
    try {
      const arr = JSON.parse(card.ideas_notes);
      return Array.isArray(arr) ? arr.map((n: any) => n.text).filter(Boolean).join('\n') : card.ideas_notes;
    } catch { return card.ideas_notes; }
  })();
  if (!notesText.trim()) { res.status(400).json({ error: 'No ideas notes to generate from' }); return; }
  try {
    const script = await generateScript(notesText, apiKey);
    await db.run('UPDATE video_cards SET script = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [script, id]);
    res.json({ script });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Script generation failed' });
  }
});

// ── Global Express error handler (catches async throws in Express 5) ──────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[express error handler]', err?.message ?? err);
  if (!res.headersSent) {
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

// ── Init & Start ──────────────────────────────────────────────────────────────
await initDb();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Noiseless Studio backend running on http://localhost:${PORT}`);
});
