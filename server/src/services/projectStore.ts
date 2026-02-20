import fs from 'fs/promises';
import path from 'path';
import { Project } from '../types/project';
import { config } from '../config';
import { logger } from '../utils/logger';

const STORE_DIR = path.join(config.outputDir, 'projects');
const INDEX_FILE = path.join(STORE_DIR, '_index.json');

// In-memory cache backed by disk
let projects = new Map<string, Project>();
let initialized = false;

async function ensureDir(): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
}

function projectFile(id: string): string {
  return path.join(STORE_DIR, `${id}.json`);
}

export async function initStore(): Promise<void> {
  if (initialized) return;
  await ensureDir();

  try {
    const files = await fs.readdir(STORE_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('_'));

    for (const file of jsonFiles) {
      try {
        const raw = await fs.readFile(path.join(STORE_DIR, file), 'utf-8');
        const project: Project = JSON.parse(raw);
        projects.set(project.id, project);
      } catch (err) {
        logger.warn(`Failed to load project file ${file}: ${err}`);
      }
    }

    logger.info(`Loaded ${projects.size} projects from disk`);
    initialized = true;
  } catch {
    logger.info('No existing projects found, starting fresh');
    initialized = true;
  }
}

async function saveToDisk(project: Project): Promise<void> {
  await ensureDir();
  await fs.writeFile(projectFile(project.id), JSON.stringify(project, null, 2));
}

async function deleteFromDisk(id: string): Promise<void> {
  try {
    await fs.unlink(projectFile(id));
  } catch {}
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function getAllProjects(): Project[] {
  return Array.from(projects.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function setProject(project: Project): Promise<void> {
  projects.set(project.id, project);
  await saveToDisk(project);
}

export async function deleteProject(id: string): Promise<boolean> {
  const existed = projects.delete(id);
  if (existed) {
    await deleteFromDisk(id);
  }
  return existed;
}

// Save a project without awaiting (fire-and-forget for frequent updates like status changes)
export function saveProjectAsync(project: Project): void {
  projects.set(project.id, project);
  saveToDisk(project).catch(err =>
    logger.warn(`Background save failed for ${project.id}: ${err}`)
  );
}
