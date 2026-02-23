import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  res.json(rows);
});

router.get('/:id', (req: Request, res: Response) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Product not found' });
  res.json(row);
});

router.post('/', (req: Request, res: Response) => {
  const { name, slug, description, key_ingredients, marketing_angle, target_audience, amazon_link, image_path } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' });
  const result = db.prepare(`
    INSERT INTO products (name, slug, description, key_ingredients, marketing_angle, target_audience, amazon_link, image_path)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, description ?? null, key_ingredients ?? null, marketing_angle ?? null, target_audience ?? null, amazon_link ?? null, image_path ?? null);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.put('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  const { name, slug, description, key_ingredients, marketing_angle, target_audience, amazon_link, image_path } = req.body;
  db.prepare(`
    UPDATE products SET
      name = COALESCE(?, name),
      slug = COALESCE(?, slug),
      description = COALESCE(?, description),
      key_ingredients = COALESCE(?, key_ingredients),
      marketing_angle = COALESCE(?, marketing_angle),
      target_audience = COALESCE(?, target_audience),
      amazon_link = COALESCE(?, amazon_link),
      image_path = COALESCE(?, image_path)
    WHERE id = ?
  `).run(name ?? null, slug ?? null, description ?? null, key_ingredients ?? null, marketing_angle ?? null, target_audience ?? null, amazon_link ?? null, image_path ?? null, req.params.id);
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req: Request, res: Response) => {
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

export default router;
