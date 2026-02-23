import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { getProject, setProject } from './projects';
import { compileVideo } from '../services/compiler';
import { config } from '../config';
import { logger } from '../utils/logger';
import { db } from '../db';

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

const router = Router();

// POST /api/projects/:id/compile - compile final video
router.post('/:id/compile', async (req, res, next) => {
  try {
    const project = getProject(paramStr(req.params.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Update settings if provided
    if (req.body.titleText !== undefined) {
      project.settings.titleText = req.body.titleText;
    }
    if (req.body.titlePosition !== undefined) {
      project.settings.titlePosition = req.body.titlePosition;
    }
    if (req.body.borderWidthPercent !== undefined) {
      project.settings.borderWidthPercent = req.body.borderWidthPercent;
    }

    const completedClips = project.clips.filter(c => c.status === 'completed');
    if (completedClips.length === 0) {
      res.status(400).json({ error: 'No completed clips to compile' });
      return;
    }

    project.status = 'compiling';
    logger.info(`Compiling ${completedClips.length} clips for project ${project.id}`);

    const outputPath = await compileVideo(project);
    project.finalVideoPath = outputPath;
    project.status = 'completed';
    await setProject(project);

    // Auto-create a video_metadata record so this video appears in the Library
    try {
      db.prepare(`
        INSERT INTO video_metadata (project_id, file_path, status)
        VALUES (?, ?, 'completed')
      `).run(project.id, outputPath);
    } catch (metaErr: any) {
      // Non-fatal: log but don't fail the compile response
      logger.warn(`Could not create video_metadata record for project ${project.id}: ${metaErr.message}`);
    }

    res.json({
      message: 'Compilation complete',
      path: outputPath,
      clipCount: completedClips.length,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/download - download final video
router.get('/:id/download', async (req, res) => {
  const project = getProject(paramStr(req.params.id));
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  if (!project.finalVideoPath) {
    res.status(400).json({ error: 'No compiled video available' });
    return;
  }

  try {
    await fs.access(project.finalVideoPath);
    const filename = `${project.name.replace(/[^a-zA-Z0-9-_ ]/g, '')}_final.mp4`;
    res.download(project.finalVideoPath, filename);
  } catch {
    res.status(404).json({ error: 'Video file not found on disk' });
  }
});

export default router;
