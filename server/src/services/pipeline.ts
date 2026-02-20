import { EventEmitter } from 'events';
import { Project, Clip, PipelineEvent } from '../types/project';
import { generateImage, downloadSelectedImage } from './imageGen';
import { uploadImageAsAsset } from './assetUpload';
import { generateVideo } from './videoGen';
import { logger } from '../utils/logger';
import { saveProjectAsync } from './projectStore';

export class PipelineOrchestrator extends EventEmitter {
  private project: Project;
  private running = false;
  private aborted = false;

  constructor(project: Project) {
    super();
    this.project = project;
  }

  private emit_event(type: string, clipIndex?: number, data?: any): void {
    const event: PipelineEvent = {
      type,
      projectId: this.project.id,
      clipIndex,
      data,
      timestamp: new Date().toISOString(),
    };
    this.emit('progress', event);
    // Persist project state to disk after every status change
    saveProjectAsync(this.project);
  }

  async run(): Promise<Project> {
    if (this.running) throw new Error('Pipeline already running');
    this.running = true;
    this.aborted = false;
    this.project.status = 'generating';
    this.emit_event('pipeline_started');

    try {
      const clipsToProcess = this.project.clips.filter(
        c => c.status !== 'completed' && c.status !== 'skipped'
      );

      await Promise.allSettled(
        clipsToProcess.map(async (clip) => {
          if (this.aborted) {
            logger.info('Pipeline aborted by user');
            return;
          }

          try {
            await this.processClip(clip);
          } catch (error: any) {
            logger.error(`Clip ${clip.index} failed after retries: ${error.message}`);
            clip.status = 'failed';
            clip.error = error.message;
            this.emit_event('clip_failed', clip.index, { error: error.message });

            // Mark as skipped and continue
            clip.status = 'skipped';
            this.emit_event('clip_skipped', clip.index);
          }
        })
      );

      const completedClips = this.project.clips.filter(c => c.status === 'completed');
      const skippedClips = this.project.clips.filter(c => c.status === 'skipped');

      if (completedClips.length === 0) {
        this.project.status = 'error';
        this.emit_event('pipeline_error', undefined, { message: 'No clips completed' });
      } else {
        this.project.status = this.aborted ? 'draft' : 'draft'; // Ready for compilation
        this.emit_event('pipeline_completed', undefined, {
          completed: completedClips.length,
          skipped: skippedClips.length,
          total: this.project.clips.length,
        });
      }
    } finally {
      this.running = false;
    }

    return this.project;
  }

  private async processClip(clip: Clip): Promise<void> {
    const autoPickImage = this.project.settings.autoPickImage;

    // Step 1: Generate image
    clip.status = 'generating_image';
    clip.retryCount = 0;
    this.emit_event('clip_status_changed', clip.index, { status: clip.status });

    await generateImage(clip, this.project.id, autoPickImage, this.project.accountEmail);

    if (!autoPickImage && clip.generatedImages && clip.generatedImages.length > 1) {
      // Wait for user to select an image
      clip.status = 'reviewing_image';
      this.emit_event('image_review_needed', clip.index, {
        images: clip.generatedImages,
      });

      // Wait for selection (will be resolved by selectImage method)
      await this.waitForImageSelection(clip);

      // Download the selected image
      await downloadSelectedImage(clip, this.project.id);
    }

    // Step 2: Upload image as asset
    clip.status = 'uploading_asset';
    this.emit_event('clip_status_changed', clip.index, { status: clip.status });

    if (!clip.localImagePath) {
      throw new Error(`Clip ${clip.index}: no local image path after generation`);
    }

    clip.uploadedMediaGenerationId = await uploadImageAsAsset(
      clip.localImagePath,
      this.project.accountEmail
    );

    // Step 3: Generate video
    clip.status = 'generating_video';
    this.emit_event('clip_status_changed', clip.index, { status: clip.status });

    await generateVideo(clip, this.project.id, this.project.accountEmail, (status, elapsed) => {
      this.emit_event('video_progress', clip.index, {
        jobStatus: status,
        elapsed: Math.round(elapsed / 1000),
      });
    });

    // Done
    clip.status = 'completed';
    this.emit_event('clip_completed', clip.index);
    logger.info(`Clip ${clip.index} completed successfully`);
  }

  private waitForImageSelection(clip: Clip): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.aborted) {
          clearInterval(checkInterval);
          reject(new Error('Pipeline aborted'));
        }
        if (clip.selectedImageIndex !== undefined) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        // Auto-select first image if user doesn't respond
        if (clip.selectedImageIndex === undefined) {
          logger.warn(`Clip ${clip.index}: image selection timeout, auto-selecting first image`);
          clip.selectedImageIndex = 0;
          resolve();
        }
      }, 600000);
    });
  }

  selectImage(clipIndex: number, imageIndex: number): void {
    const clip = this.project.clips.find(c => c.index === clipIndex);
    if (!clip) throw new Error(`Clip ${clipIndex} not found`);
    if (clip.status !== 'reviewing_image') {
      throw new Error(`Clip ${clipIndex} is not awaiting image review (status: ${clip.status})`);
    }
    if (!clip.generatedImages || imageIndex >= clip.generatedImages.length) {
      throw new Error(`Invalid image index ${imageIndex}`);
    }

    clip.selectedImageIndex = imageIndex;
    this.emit_event('image_selected', clipIndex, { imageIndex });
  }

  abort(): void {
    this.aborted = true;
    this.emit_event('pipeline_aborted');
  }

  isRunning(): boolean {
    return this.running;
  }

  getProject(): Project {
    return this.project;
  }
}

// In-memory store of active pipelines
const activePipelines = new Map<string, PipelineOrchestrator>();

export function getPipeline(projectId: string): PipelineOrchestrator | undefined {
  return activePipelines.get(projectId);
}

export function setPipeline(projectId: string, pipeline: PipelineOrchestrator): void {
  activePipelines.set(projectId, pipeline);
}

export function removePipeline(projectId: string): void {
  activePipelines.delete(projectId);
}
