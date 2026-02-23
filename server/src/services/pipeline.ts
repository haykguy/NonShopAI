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

    const clipsToProcess = this.project.clips.filter(
      c => c.status !== 'completed' && c.status !== 'skipped'
    );
    logger.info(`[Pipeline] Starting for project ${this.project.id}: ${clipsToProcess.length} clips to process (${this.project.clips.length} total)`);

    try {
      await Promise.allSettled(
        clipsToProcess.map(async (clip) => {
          if (this.aborted) {
            logger.info(`[Pipeline] Aborted — skipping clip ${clip.index}`);
            return;
          }

          try {
            await this.processClip(clip);
          } catch (error: any) {
            logger.error(`[Pipeline] Clip ${clip.index} failed: ${error.message}`, error.stack);
            clip.status = 'failed';
            clip.error = error.message;
            this.emit_event('clip_failed', clip.index, { error: error.message });

            // Mark as skipped and continue with remaining clips
            clip.status = 'skipped';
            this.emit_event('clip_skipped', clip.index);
          }
        })
      );

      const completedClips = this.project.clips.filter(c => c.status === 'completed');
      const skippedClips = this.project.clips.filter(c => c.status === 'skipped');

      logger.info(`[Pipeline] Done — completed: ${completedClips.length}, skipped: ${skippedClips.length}, total: ${this.project.clips.length}`);

      if (completedClips.length === 0) {
        this.project.status = 'error';
        logger.error(`[Pipeline] All clips failed for project ${this.project.id}`);
        this.emit_event('pipeline_error', undefined, { message: 'No clips completed successfully' });
      } else {
        this.project.status = 'draft'; // Ready for compilation
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
    logger.info(`[Clip ${clip.index}] Starting — autoPickImage: ${autoPickImage}`);

    // Step 1: Generate image
    clip.status = 'generating_image';
    clip.retryCount = 0;
    this.emit_event('clip_status_changed', clip.index, { status: clip.status });
    logger.info(`[Clip ${clip.index}] Generating image...`);

    await generateImage(clip, this.project.id, autoPickImage, this.project.accountEmail);
    logger.info(`[Clip ${clip.index}] Image generated — localImagePath: ${clip.localImagePath}`);

    if (!autoPickImage && clip.generatedImages && clip.generatedImages.length > 1) {
      // Wait for user to select an image
      clip.status = 'reviewing_image';
      this.emit_event('image_review_needed', clip.index, {
        images: clip.generatedImages,
      });
      logger.info(`[Clip ${clip.index}] Awaiting user image selection...`);

      // Wait for selection (will be resolved by selectImage method)
      await this.waitForImageSelection(clip);
      logger.info(`[Clip ${clip.index}] Image selected: index ${clip.selectedImageIndex}`);

      // Download the selected image
      await downloadSelectedImage(clip, this.project.id);
      logger.info(`[Clip ${clip.index}] Selected image downloaded: ${clip.localImagePath}`);
    }

    // Step 2: Upload image as asset
    clip.status = 'uploading_asset';
    this.emit_event('clip_status_changed', clip.index, { status: clip.status });

    if (!clip.localImagePath) {
      throw new Error(`Clip ${clip.index}: no local image path after generation`);
    }

    logger.info(`[Clip ${clip.index}] Uploading image asset: ${clip.localImagePath}`);
    clip.uploadedMediaGenerationId = await uploadImageAsAsset(
      clip.localImagePath,
      this.project.accountEmail
    );
    logger.info(`[Clip ${clip.index}] Asset uploaded — mediaGenerationId: ${clip.uploadedMediaGenerationId}`);

    // Step 3: Generate video
    clip.status = 'generating_video';
    this.emit_event('clip_status_changed', clip.index, { status: clip.status });
    logger.info(`[Clip ${clip.index}] Generating video...`);

    await generateVideo(clip, this.project.id, this.project.accountEmail, (status, elapsed) => {
      logger.info(`[Clip ${clip.index}] Video job status: ${status} (${Math.round(elapsed / 1000)}s elapsed)`);
      this.emit_event('video_progress', clip.index, {
        jobStatus: status,
        elapsed: Math.round(elapsed / 1000),
      });
    });

    // Done
    clip.status = 'completed';
    this.emit_event('clip_completed', clip.index);
    logger.info(`[Clip ${clip.index}] Completed successfully — video: ${clip.localVideoPath}`);
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
