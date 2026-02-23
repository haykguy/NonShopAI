import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { Project, Clip } from '../types/project';
import { parsePdf } from '../services/pdfParser';
import { config } from '../config';
import { logger } from '../utils/logger';
import {
  getProject as storeGet,
  getAllProjects,
  setProject as storeSet,
  deleteProject as storeDel,
  saveProjectAsync,
} from '../services/projectStore';

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

const router = Router();
const upload = multer({ dest: path.join(config.outputDir, 'uploads') });

// Re-export for use by other route files
export function getProject(id: string): Project | undefined {
  return storeGet(id);
}

export async function setProject(project: Project): Promise<void> {
  await storeSet(project);
}

// GET /api/projects - list all projects
router.get('/', (_req, res) => {
  const list = getAllProjects().map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    createdAt: p.createdAt,
    clipCount: p.clips.length,
    completedClips: p.clips.filter(c => c.status === 'completed').length,
  }));
  res.json(list);
});

// POST /api/projects - create new project
router.post('/', async (req, res, next) => {
  try {
    const { name, clipCount, settings, clips: bodyClips } = req.body;
    const count = Math.max(1, Math.min(20, clipCount || 7));

    // If caller passes pre-built clips array, use it; otherwise create empty ones
    let clips: Clip[];
    if (Array.isArray(bodyClips) && bodyClips.length > 0) {
      clips = bodyClips.map((c: any, i: number): Clip => ({
        index: i,
        imagePrompt: c.imagePrompt || '',
        videoPrompt: c.videoPrompt || '',
        status: 'pending',
        retryCount: 0,
        avatarImageUrl: c.avatarImageUrl || undefined,
      }));
    } else {
      clips = Array.from({ length: count }, (_, i): Clip => ({
        index: i,
        imagePrompt: '',
        videoPrompt: '',
        status: 'pending',
        retryCount: 0,
      }));
    }

    const project: Project = {
      id: uuidv4(),
      name: name || `Project ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      status: 'draft',
      settings: {
        titleText: settings?.titleText || '',
        titlePosition: settings?.titlePosition || 'bottom',
        autoPickImage: settings?.autoPickImage ?? true,
        borderWidthPercent: settings?.borderWidthPercent ?? 5,
        aspectRatio: settings?.aspectRatio || '9:16',
        titleYPercent: settings?.titleYPercent ?? 85,
        titleFontSize: settings?.titleFontSize ?? 42,
        titleColor: settings?.titleColor || '#ffffff',
        titleBoxOpacity: settings?.titleBoxOpacity ?? 0.6,
      },
      clips,
    };

    await storeSet(project);
    logger.info(`Project created: ${project.id} with ${clips.length} clips`);
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - get project details
router.get('/:id', (req, res) => {
  const project = storeGet(paramStr(req.params.id));
  if (!project) {
    res.status(404).json({ error: 'Project not found' });
    return;
  }
  res.json(project);
});

// PUT /api/projects/:id - update project settings
router.put('/:id', async (req, res, next) => {
  try {
    const project = storeGet(paramStr(req.params.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { name, settings, accountEmail } = req.body;
    if (name) project.name = name;
    if (accountEmail) project.accountEmail = accountEmail;
    if (settings) {
      Object.assign(project.settings, settings);
    }

    await storeSet(project);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id/clips - update all clip prompts
router.put('/:id/clips', async (req, res, next) => {
  try {
    const project = storeGet(paramStr(req.params.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { clips } = req.body;
    if (!Array.isArray(clips)) {
      res.status(400).json({ error: 'clips must be an array' });
      return;
    }

    // Update or replace clips
    project.clips = clips.map((c: any, i: number): Clip => ({
      index: i,
      imagePrompt: c.imagePrompt || '',
      videoPrompt: c.videoPrompt || '',
      status: 'pending',
      retryCount: 0,
    }));

    await storeSet(project);
    logger.info(`Updated ${project.clips.length} clips for project ${project.id}`);
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/parse-pdf - upload and parse PDF
router.post('/:id/parse-pdf', upload.single('pdf'), async (req, res, next) => {
  try {
    const project = storeGet(paramStr(req.params.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded' });
      return;
    }

    const parsedClips = await parsePdf(req.file.path);

    // Update project clips with parsed content
    project.clips = parsedClips.map((c, i): Clip => ({
      index: i,
      imagePrompt: c.imagePrompt,
      videoPrompt: c.videoPrompt,
      status: 'pending',
      retryCount: 0,
    }));

    await storeSet(project);

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(() => {});

    logger.info(`Parsed PDF: ${parsedClips.length} clips for project ${project.id}`);
    res.json({
      clipCount: parsedClips.length,
      clips: project.clips,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - delete project
router.delete('/:id', async (req, res, next) => {
  try {
    const id = paramStr(req.params.id);
    const existed = await storeDel(id);
    if (!existed) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    logger.info(`Project deleted: ${id}`);
    res.json({ message: 'Project deleted' });
  } catch (error) {
    next(error);
  }
});

export { saveProjectAsync };
export default router;
