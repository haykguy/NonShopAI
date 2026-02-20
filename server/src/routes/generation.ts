import { Router, Request, Response } from 'express';
import { getProject } from './projects';
import {
  PipelineOrchestrator,
  getPipeline,
  setPipeline,
  removePipeline,
} from '../services/pipeline';
import { apiClient } from '../services/useapi';
import { logger } from '../utils/logger';

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

const router = Router();

// POST /api/projects/:id/generate - start generation pipeline
router.post('/:id/generate', async (req: Request, res: Response, next) => {
  try {
    const project = getProject(paramStr(paramStr(req.params.id)));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (project.status === 'generating') {
      res.status(409).json({ error: 'Pipeline already running' });
      return;
    }

    // Validate clips have prompts
    const emptyClips = project.clips.filter(c => !c.imagePrompt || !c.videoPrompt);
    if (emptyClips.length > 0) {
      res.status(400).json({
        error: `${emptyClips.length} clip(s) missing prompts`,
        emptyClipIndices: emptyClips.map(c => c.index),
      });
      return;
    }

    // Auto-detect account email if not set
    if (!project.accountEmail) {
      const accounts = await apiClient.getAccounts();
      const emails = Object.keys(accounts);
      if (emails.length === 0) {
        res.status(400).json({ error: 'No Google Flow accounts configured' });
        return;
      }
      project.accountEmail = emails[0];
      logger.info(`Auto-selected account: ${project.accountEmail}`);
    }

    // Create and start pipeline
    const pipeline = new PipelineOrchestrator(project);
    setPipeline(project.id, pipeline);

    // Start pipeline in background (don't await)
    pipeline.run().then(() => {
      logger.info(`Pipeline completed for project ${project.id}`);
    }).catch(err => {
      logger.error(`Pipeline error for project ${project.id}: ${err.message}`);
      project.status = 'error';
    });

    res.json({
      message: 'Generation started',
      projectId: project.id,
      clipCount: project.clips.length,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/abort - abort pipeline
router.post('/:id/abort', (req: Request, res: Response) => {
  const pipeline = getPipeline(paramStr(req.params.id));
  if (!pipeline) {
    res.status(404).json({ error: 'No active pipeline' });
    return;
  }

  pipeline.abort();
  res.json({ message: 'Abort requested' });
});

// POST /api/projects/:id/clips/:clipIndex/select-image - select image for clip
router.post('/:id/clips/:clipIndex/select-image', (req: Request, res: Response) => {
  const pipeline = getPipeline(paramStr(req.params.id));
  const project = getProject(paramStr(req.params.id));

  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  const clipIndex = parseInt(paramStr(req.params.clipIndex), 10);
  const { imageIndex } = req.body;

  if (typeof imageIndex !== 'number') {
    res.status(400).json({ error: 'imageIndex is required' });
    return;
  }

  if (pipeline) {
    try {
      pipeline.selectImage(clipIndex, imageIndex);
      res.json({ message: 'Image selected', clipIndex, imageIndex });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  } else {
    // Pipeline not running, just update the clip directly
    const clip = project.clips.find(c => c.index === clipIndex);
    if (!clip) {
      res.status(404).json({ error: 'Clip not found' });
      return;
    }
    clip.selectedImageIndex = imageIndex;
    res.json({ message: 'Image selected', clipIndex, imageIndex });
  }
});

// GET /api/projects/:id/status - SSE endpoint for real-time progress
router.get('/:id/status', (req: Request, res: Response) => {
  const project = getProject(paramStr(req.params.id));
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send current state immediately
  res.write(`data: ${JSON.stringify({
    type: 'initial_state',
    projectId: project.id,
    data: project,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  const pipeline = getPipeline(paramStr(req.params.id));
  if (!pipeline) {
    res.write(`data: ${JSON.stringify({
      type: 'no_pipeline',
      projectId: project.id,
      timestamp: new Date().toISOString(),
    })}\n\n`);
  }

  // Listen for pipeline events
  const listener = (event: any) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  if (pipeline) {
    pipeline.on('progress', listener);
  }

  // Keep alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    if (pipeline) {
      pipeline.off('progress', listener);
    }
  });
});

export default router;
