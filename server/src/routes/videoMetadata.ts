import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/stats/monthly', (_req: Request, res: Response) => {
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const totalThisMonth = (db.prepare(`
    SELECT COUNT(*) as count FROM video_metadata WHERE created_at >= ?
  `).get(firstOfMonth) as { count: number }).count;

  const byAccount = db.prepare(`
    SELECT
      vm.account_id,
      a.name AS account_name,
      COUNT(*) AS count,
      a.monthly_video_goal AS goal
    FROM video_metadata vm
    LEFT JOIN accounts a ON vm.account_id = a.id
    WHERE vm.created_at >= ?
    GROUP BY vm.account_id
  `).all(firstOfMonth);

  const overallGoal = (db.prepare(`
    SELECT COALESCE(SUM(monthly_video_goal), 0) AS total FROM accounts
  `).get() as { total: number }).total;

  res.json({ total_this_month: totalThisMonth, by_account: byAccount, overall_goal: overallGoal });
});

router.get('/', (req: Request, res: Response) => {
  const { account_id, product_id, month } = req.query;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (account_id) { conditions.push('vm.account_id = ?'); params.push(account_id as string); }
  if (product_id) { conditions.push('vm.product_id = ?'); params.push(product_id as string); }
  if (month) { conditions.push("strftime('%Y-%m', vm.created_at) = ?"); params.push(month as string); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT vm.* FROM video_metadata vm ${where} ORDER BY vm.created_at DESC`).all(...params);
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM video_metadata WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Video metadata not found' });
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { project_id, account_id, product_id, video_style_id, avatar_id, script_id, render_mode, prehook_style, status, file_path, thumbnail_path, duration_seconds, notes } = req.body;
  if (!project_id) return res.status(400).json({ error: 'project_id is required' });
  const result = db.prepare(`
    INSERT INTO video_metadata
      (project_id, account_id, product_id, video_style_id, avatar_id, script_id, render_mode, prehook_style, status, file_path, thumbnail_path, duration_seconds, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(project_id, account_id ?? null, product_id ?? null, video_style_id ?? null, avatar_id ?? null, script_id ?? null, render_mode ?? 'veo-only', prehook_style ?? null, status ?? 'completed', file_path ?? null, thumbnail_path ?? null, duration_seconds ?? null, notes ?? null);
  const row = db.prepare('SELECT * FROM video_metadata WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM video_metadata WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Video metadata not found' });
  const { account_id, product_id, video_style_id, avatar_id, script_id, render_mode, prehook_style, status, file_path, thumbnail_path, duration_seconds, notes } = req.body;
  db.prepare(`
    UPDATE video_metadata SET
      account_id = COALESCE(?, account_id),
      product_id = COALESCE(?, product_id),
      video_style_id = COALESCE(?, video_style_id),
      avatar_id = COALESCE(?, avatar_id),
      script_id = COALESCE(?, script_id),
      render_mode = COALESCE(?, render_mode),
      prehook_style = COALESCE(?, prehook_style),
      status = COALESCE(?, status),
      file_path = COALESCE(?, file_path),
      thumbnail_path = COALESCE(?, thumbnail_path),
      duration_seconds = COALESCE(?, duration_seconds),
      notes = COALESCE(?, notes)
    WHERE id = ?
  `).run(account_id ?? null, product_id ?? null, video_style_id ?? null, avatar_id ?? null, script_id ?? null, render_mode ?? null, prehook_style ?? null, status ?? null, file_path ?? null, thumbnail_path ?? null, duration_seconds ?? null, notes ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM video_metadata WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM video_metadata WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Video metadata not found' });
  db.prepare('DELETE FROM video_metadata WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
