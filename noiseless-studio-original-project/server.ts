import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initDb, openDb } from './db';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // Set up multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // Initialize DB
  await initDb();

  // Add test generation if empty
  try {
    const db = await openDb();
    const result = await db.get('SELECT COUNT(*) as count FROM generations');
    if (result && result.count === 0) {
      await db.run("INSERT INTO generations (prompt, title, filename, type) VALUES ('Test Prompt', 'Test Title', 'test.mp4', 'video')");
      console.log('Added test generation');
    }
  } catch (error) {
    console.error('Error adding test generation:', error);
  }

  // API Routes
  app.get('/api/generations', async (req, res) => {
    try {
      const db = await openDb();
      const generations = await db.all('SELECT * FROM generations ORDER BY timestamp DESC');
      res.json(generations);
    } catch (error) {
      console.error('Error fetching generations:', error);
      res.status(500).json({ error: 'Failed to fetch generations' });
    }
  });

  app.post('/api/generations', upload.single('file'), async (req, res) => {
    try {
      const { prompt, title, type } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const db = await openDb();
      const result = await db.run(
        'INSERT INTO generations (prompt, title, filename, type) VALUES (?, ?, ?, ?)',
        [prompt, title, file.filename, type]
      );

      res.json({ id: result.lastID, filename: file.filename });
    } catch (error) {
      console.error('Error saving generation:', error);
      res.status(500).json({ error: 'Failed to save generation' });
    }
  });

  app.post('/api/generations/start', async (req, res) => {
    try {
      const { prompt, title, type } = req.body;
      const db = await openDb();
      const result = await db.run(
        'INSERT INTO generations (prompt, title, filename, type) VALUES (?, ?, ?, ?)',
        [prompt, title, 'pending', type]
      );
      res.json({ id: result.lastID });
    } catch (error) {
      console.error('Error starting generation:', error);
      res.status(500).json({ error: 'Failed to start generation' });
    }
  });

  app.put('/api/generations/:id/complete', upload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const db = await openDb();
      await db.run(
        'UPDATE generations SET filename = ? WHERE id = ?',
        [file.filename, id]
      );

      res.json({ success: true, filename: file.filename });
    } catch (error) {
      console.error('Error completing generation:', error);
      res.status(500).json({ error: 'Failed to complete generation' });
    }
  });

  app.delete('/api/generations/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await openDb();
      await db.run('DELETE FROM generations WHERE id = ?', [id]);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting generation:', error);
      res.status(500).json({ error: 'Failed to delete generation' });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(uploadsDir));

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production build
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
