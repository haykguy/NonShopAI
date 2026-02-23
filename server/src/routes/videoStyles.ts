import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { category } = req.query;
  let rows;
  if (category) {
    rows = db.prepare('SELECT * FROM video_styles WHERE category = ? ORDER BY created_at ASC').all(category as string);
  } else {
    rows = db.prepare('SELECT * FROM video_styles ORDER BY created_at ASC').all();
  }
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM video_styles WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Video style not found' });
  res.json(row);
});

export default router;
