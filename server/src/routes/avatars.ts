import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from '../db';

const avatarsDir = path.resolve(__dirname, '../../data/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, avatarsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { account_id } = req.query;
  let rows;
  if (account_id) {
    rows = db.prepare('SELECT * FROM avatars WHERE account_id = ? ORDER BY created_at DESC').all(account_id as string);
  } else {
    rows = db.prepare('SELECT * FROM avatars ORDER BY created_at DESC').all();
  }
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM avatars WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Avatar not found' });
  res.json(row);
});

router.post('/', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'image file is required' });
  const { name, description, style_tags, elevenlabs_voice_id, voice_label, account_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const imagePath = `/data/avatars/${req.file.filename}`;
  // Use same file as thumbnail (no resize needed here — frontend can handle it)
  const thumbnailPath = imagePath;

  const result = db.prepare(`
    INSERT INTO avatars (name, image_path, thumbnail_path, description, style_tags, elevenlabs_voice_id, voice_label, account_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, imagePath, thumbnailPath, description ?? null, style_tags ?? null, elevenlabs_voice_id ?? null, voice_label ?? null, account_id ?? null);

  const row = db.prepare('SELECT * FROM avatars WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM avatars WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Avatar not found' });
  const { name, description, style_tags, elevenlabs_voice_id, voice_label, account_id } = req.body;
  db.prepare(`
    UPDATE avatars SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      style_tags = COALESCE(?, style_tags),
      elevenlabs_voice_id = COALESCE(?, elevenlabs_voice_id),
      voice_label = COALESCE(?, voice_label),
      account_id = COALESCE(?, account_id)
    WHERE id = ?
  `).run(name ?? null, description ?? null, style_tags ?? null, elevenlabs_voice_id ?? null, voice_label ?? null, account_id ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM avatars WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM avatars WHERE id = ?').get(req.params.id) as { image_path: string } | undefined;
  if (!existing) return res.status(404).json({ error: 'Avatar not found' });

  // Delete the physical image file
  const absPath = path.resolve(__dirname, '../..', existing.image_path.replace(/^\//, ''));
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath);
  }

  db.prepare('DELETE FROM avatars WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
