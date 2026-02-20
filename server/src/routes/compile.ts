import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { getProject, setProject } from './projects';
import { compileVideo } from '../services/compiler';
import { config } from '../config';
import { logger } from '../utils/logger';

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
