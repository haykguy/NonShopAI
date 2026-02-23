import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

const FULL_SELECT = `
  SELECT
    a.*,
    p.name AS default_product_name,
    av.name AS default_avatar_name
  FROM accounts a
  LEFT JOIN products p ON a.default_product_id = p.id
  LEFT JOIN avatars av ON a.default_avatar_id = av.id
`;

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare(`${FULL_SELECT} ORDER BY a.created_at DESC`).all();
  res.json(rows);
});

// Stats route must be defined before /:id to avoid being shadowed
router.get('/:id/stats', (req: Request, res: Response) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id) as { monthly_video_goal: number } | undefined;
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const videosThisMonth = (db.prepare(`
    SELECT COUNT(*) as count FROM video_metadata
    WHERE account_id = ? AND created_at >= ?
  `).get(req.params.id, firstOfMonth) as { count: number }).count;

  const videosAllTime = (db.prepare(`
    SELECT COUNT(*) as count FROM video_metadata WHERE account_id = ?
  `).get(req.params.id) as { count: number }).count;

  res.json({
    monthly_goal: account.monthly_video_goal,
    videos_this_month: videosThisMonth,
    videos_all_time: videosAllTime,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare(`${FULL_SELECT} WHERE a.id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Account not found' });
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { name, platform, default_product_id, default_avatar_id, monthly_video_goal, notes } = req.body;
  if (!name || !platform) return res.status(400).json({ error: 'name and platform are required' });
  const result = db.prepare(`
    INSERT INTO accounts (name, platform, default_product_id, default_avatar_id, monthly_video_goal, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, platform, default_product_id ?? null, default_avatar_id ?? null, monthly_video_goal ?? 20, notes ?? null);
  const row = db.prepare(`${FULL_SELECT} WHERE a.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Account not found' });
  const { name, platform, default_product_id, default_avatar_id, monthly_video_goal, notes } = req.body;
  db.prepare(`
    UPDATE accounts SET
      name = COALESCE(?, name),
      platform = COALESCE(?, platform),
      default_product_id = COALESCE(?, default_product_id),
      default_avatar_id = COALESCE(?, default_avatar_id),
      monthly_video_goal = COALESCE(?, monthly_video_goal),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(name ?? null, platform ?? null, default_product_id ?? null, default_avatar_id ?? null, monthly_video_goal ?? null, notes ?? null, req.params.id);
  const row = db.prepare(`${FULL_SELECT} WHERE a.id = ?`).get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Account not found' });
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
