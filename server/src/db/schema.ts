import { db } from './database';

export function runSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      key_ingredients TEXT,
      marketing_angle TEXT,
      target_audience TEXT,
      amazon_link TEXT,
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS video_styles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      example_image_path TEXT,
      structure_template TEXT,
      image_prompt_style TEXT,
      clip_count_default INTEGER DEFAULT 7,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      platform TEXT NOT NULL,
      default_product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      default_avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL,
      monthly_video_goal INTEGER DEFAULT 20,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS avatars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_path TEXT NOT NULL,
      thumbnail_path TEXT,
      description TEXT,
      style_tags TEXT,
      elevenlabs_voice_id TEXT,
      voice_label TEXT,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS saved_scripts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      video_style_id INTEGER REFERENCES video_styles(id) ON DELETE SET NULL,
      title TEXT,
      script_text TEXT NOT NULL,
      clip_prompts TEXT,
      performance_notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS video_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id TEXT NOT NULL,
      account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      video_style_id INTEGER REFERENCES video_styles(id) ON DELETE SET NULL,
      avatar_id INTEGER REFERENCES avatars(id) ON DELETE SET NULL,
      script_id INTEGER REFERENCES saved_scripts(id) ON DELETE SET NULL,
      render_mode TEXT DEFAULT 'veo-only',
      prehook_style TEXT,
      status TEXT DEFAULT 'completed',
      file_path TEXT,
      thumbnail_path TEXT,
      duration_seconds INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}
