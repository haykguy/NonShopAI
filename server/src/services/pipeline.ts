import { EventEmitter } from 'events';
import { Project, Clip, PipelineEvent } from '../types/project';
import { generateImage, downloadSelectedImage } from './imageGen';
import { uploadImageAsAsset } from './assetUpload';
import { generateVideo } from './videoGen';
import { compileVideo } from './compiler';
import { logger } from '../utils/logger';
import { saveProjectAsync } from './projectStore';
import { db } from '../db';

const MAX_CLIP_RETRIES = 3;

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
      c => c.status !== 'completed'
    );
    logger.info(`[Pipeline] Starting for project ${this.project.id}: ${clipsToProcess.length} clips to process (${this.project.clips.length} total)`);

    try {
      await Promise.allSettled(
        clipsToProcess.map(async (clip) => {
          if (this.aborted) {
            logger.info(`[Pipeline] Aborted — skipping clip ${clip.index}`);
            return;
          }

          let attempt = 0;
          while (attempt < MAX_CLIP_RETRIES) {
            attempt++;
            try {
              // Reset clip state for retry attempts
              if (attempt > 1) {
                logger.info(`[Pipeline] Retrying clip ${clip.index} (attempt ${attempt}/${MAX_CLIP_RETRIES})...`);
                clip.error = undefined;
                clip.status = 'pending';
                this.emit_event('clip_status_changed', clip.index, { status: clip.status, attempt });
              }
              await this.processClip(clip);
              // Record completed clip in DB
              try {
                db.prepare(`
                  INSERT OR REPLACE INTO project_clips
                    (project_id, clip_index, image_path, video_path, image_prompt, video_prompt, status)
                  VALUES (?, ?, ?, ?, ?, ?, 'completed')
                `).run(
                  this.project.id,
                  clip.index,
                  clip.localImagePath ?? null,
                  clip.localVideoPath ?? null,
                  clip.imagePrompt ?? null,
                  clip.videoPrompt ?? null
                );
              } catch (dbErr: any) {
                logger.warn(`[Pipeline] Could not record clip ${clip.index} in DB: ${dbErr.message}`);
              }
              break; // Success — stop retrying
            } catch (error: any) {
              logger.error(`[Pipeline] Clip ${clip.index} attempt ${attempt} failed: ${error.message}`, error.stack);
              clip.status = 'failed';
              clip.error = error.message;
              this.emit_event('clip_failed', clip.index, { error: error.message, attempt });

              if (attempt >= MAX_CLIP_RETRIES) {
                logger.error(`[Pipeline] Clip ${clip.index} exhausted all ${MAX_CLIP_RETRIES} retries — giving up`);
                // Keep as 'failed' — do NOT mark as skipped
                try {
                  db.prepare(`
                    INSERT OR REPLACE INTO project_clips
                      (project_id, clip_index, image_path, video_path, image_prompt, video_prompt, status)
                    VALUES (?, ?, ?, ?, ?, ?, 'failed')
                  `).run(
                    this.project.id,
                    clip.index,
                    clip.localImagePath ?? null,
                    clip.localVideoPath ?? null,
                    clip.imagePrompt ?? null,
                    clip.videoPrompt ?? null
                  );
                } catch (dbErr: any) {
                  logger.warn(`[Pipeline] Could not record failed clip ${clip.index} in DB: ${dbErr.message}`);
                }
              }
            }
          }
        })
      );

      const completedClips = this.project.clips.filter(c => c.status === 'completed');
      const failedClips = this.project.clips.filter(c => c.status === 'failed');

      logger.info(`[Pipeline] Done — completed: ${completedClips.length}, failed: ${failedClips.length}, total: ${this.project.clips.length}`);

      if (completedClips.length === 0) {
        this.project.status = 'error';
        logger.error(`[Pipeline] All clips failed for project ${this.project.id}`);
        this.emit_event('pipeline_error', undefined, { message: 'No clips completed successfully' });
      } else {
        // Auto-compile: concatenate completed clips with borders and text overlay
        logger.info(`[Pipeline] Auto-compiling ${completedClips.length} completed clip(s)...`);
        this.emit_event('compiling', undefined, { completedCount: completedClips.length });
        try {
          const outputPath = await compileVideo(this.project);
          this.project.finalVideoPath = outputPath;
          this.project.status = 'completed';
          logger.info(`[Pipeline] Compilation finished: ${outputPath}`);
          // Register in library
          try {
            db.prepare(`INSERT OR IGNORE INTO video_metadata (project_id, file_path, status) VALUES (?, ?, 'completed')`)
              .run(this.project.id, outputPath);
          } catch (dbErr: any) {
            logger.warn(`[Pipeline] Could not create video_metadata record: ${dbErr.message}`);
          }
          this.emit_event('pipeline_completed', undefined, {
            completed: completedClips.length,
            failed: failedClips.length,
            total: this.project.clips.length,
            finalVideoPath: outputPath,
            clips: this.project.clips,
          });
        } catch (compileErr: any) {
          logger.error(`[Pipeline] Auto-compile failed: ${compileErr.message}`, compileErr.stack);
          // Still mark as draft so user can manually compile
          this.project.status = 'draft';
          this.emit_event('pipeline_completed', undefined, {
            completed: completedClips.length,
            failed: failedClips.length,
            total: this.project.clips.length,
            compileError: compileErr.message,
            clips: this.project.clips,
          });
        }
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
