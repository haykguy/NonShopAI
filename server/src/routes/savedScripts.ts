import { Router, Request, Response } from 'express';
import { db } from '../db';
import { generateScript, RenderMode } from '../services/scriptGen';

const router = Router();

// ─── AI Generation ────────────────────────────────────────────────────────────

// POST /api/scripts/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { productId, videoStyleId, renderMode, existingScript, feedbackNotes } = req.body;

    if (!productId || !videoStyleId || !renderMode) {
      return res.status(400).json({ error: 'productId, videoStyleId, and renderMode are required' });
    }

    const validRenderModes: RenderMode[] = ['veo-only', 'heygen-11labs'];
    if (!validRenderModes.includes(renderMode)) {
      return res.status(400).json({ error: `renderMode must be one of: ${validRenderModes.join(', ')}` });
    }

    // Validate references exist
    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(404).json({ error: `Product ${productId} not found` });

    const style = db.prepare('SELECT id FROM video_styles WHERE id = ?').get(videoStyleId);
    if (!style) return res.status(404).json({ error: `Video style ${videoStyleId} not found` });

    const result = await generateScript({
      productId: Number(productId),
      videoStyleId: Number(videoStyleId),
      renderMode,
      existingScript,
      feedbackNotes,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scripts/save
router.post('/save', (req: Request, res: Response) => {
  const { productId, videoStyleId, scriptText, clipPrompts, title } = req.body;
  if (!scriptText) return res.status(400).json({ error: 'scriptText is required' });

  const clipPromptsStr = clipPrompts
    ? (typeof clipPrompts === 'string' ? clipPrompts : JSON.stringify(clipPrompts))
    : null;

  const result = db.prepare(`
    INSERT INTO saved_scripts (product_id, video_style_id, title, script_text, clip_prompts)
    VALUES (?, ?, ?, ?, ?)
  `).run(productId ?? null, videoStyleId ?? null, title ?? null, scriptText, clipPromptsStr);

  const row = db.prepare('SELECT * FROM saved_scripts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

// ─── CRUD ─────────────────────────────────────────────────────────────────────

// GET /api/scripts — all saved scripts with product and style names joined
router.get('/', (req: Request, res: Response) => {
  const { product_id } = req.query;
  let rows;
  if (product_id) {
    rows = db.prepare(`
      SELECT ss.*, p.name AS product_name, vs.name AS video_style_name
      FROM saved_scripts ss
      LEFT JOIN products p ON ss.product_id = p.id
      LEFT JOIN video_styles vs ON ss.video_style_id = vs.id
      WHERE ss.product_id = ?
      ORDER BY ss.created_at DESC
    `).all(product_id as string);
  } else {
    rows = db.prepare(`
      SELECT ss.*, p.name AS product_name, vs.name AS video_style_name
      FROM saved_scripts ss
      LEFT JOIN products p ON ss.product_id = p.id
      LEFT JOIN video_styles vs ON ss.video_style_id = vs.id
      ORDER BY ss.created_at DESC
    `).all();
  }
  res.json(rows);
});

// GET /api/scripts/:id
router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare(`
    SELECT ss.*, p.name AS product_name, vs.name AS video_style_name
    FROM saved_scripts ss
    LEFT JOIN products p ON ss.product_id = p.id
    LEFT JOIN video_styles vs ON ss.video_style_id = vs.id
    WHERE ss.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Script not found' });
  res.json(row);
});

// POST /api/scripts (raw insert — same as /save but snake_case body)
router.post('/', (req: Request, res: Response) => {
  const { product_id, video_style_id, title, script_text, clip_prompts, performance_notes } = req.body;
  if (!script_text) return res.status(400).json({ error: 'script_text is required' });
  const result = db.prepare(`
    INSERT INTO saved_scripts (product_id, video_style_id, title, script_text, clip_prompts, performance_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(product_id ?? null, video_style_id ?? null, title ?? null, script_text, clip_prompts ?? null, performance_notes ?? null);
  const row = db.prepare('SELECT * FROM saved_scripts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

// PUT /api/scripts/:id
router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM saved_scripts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Script not found' });
  const { script_text, performance_notes, title, clip_prompts } = req.body;
  db.prepare(`
    UPDATE saved_scripts SET
      title = COALESCE(?, title),
      script_text = COALESCE(?, script_text),
      clip_prompts = COALESCE(?, clip_prompts),
      performance_notes = COALESCE(?, performance_notes)
    WHERE id = ?
  `).run(title ?? null, script_text ?? null, clip_prompts ?? null, performance_notes ?? null, req.params.id);
  const row = db.prepare(`
    SELECT ss.*, p.name AS product_name, vs.name AS video_style_name
    FROM saved_scripts ss
    LEFT JOIN products p ON ss.product_id = p.id
    LEFT JOIN video_styles vs ON ss.video_style_id = vs.id
    WHERE ss.id = ?
  `).get(req.params.id);
  res.json(row);
});

// DELETE /api/scripts/:id
router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM saved_scripts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Script not found' });
  db.prepare('DELETE FROM saved_scripts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
