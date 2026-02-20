import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { Project } from '../types/project';
import { config } from '../config';
import { logger } from '../utils/logger';

const execFileAsync = promisify(execFile);

export async function compileVideo(project: Project): Promise<string> {
  const completedClips = project.clips
    .filter(c => c.status === 'completed' && c.localVideoPath)
    .sort((a, b) => a.index - b.index);

  if (completedClips.length === 0) {
    throw new Error('No completed clips to compile');
  }

  const outputDir = path.join(config.outputDir, 'final');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${project.id}_final.mp4`);

  if (completedClips.length === 1) {
    // Single clip - just process it with borders and text
    await processSingleClip(completedClips[0].localVideoPath!, outputPath, project);
  } else {
    // Multiple clips - concatenate with borders and text
    await concatenateClips(completedClips.map(c => c.localVideoPath!), outputPath, project);
  }

  logger.info(`Final video compiled: ${outputPath}`);
  return outputPath;
}

function getOutputDimensions(project: Project): { outW: number; outH: number } {
  const is16x9 = project.settings.aspectRatio === '16:9';
  return is16x9 ? { outW: 1920, outH: 1080 } : { outW: 1080, outH: 1920 };
}

function buildDrawtext(project: Project, outW: number, outH: number): string {
  const escapedText = escapeFFmpegText(project.settings.titleText);
  const fontSize = project.settings.titleFontSize ?? 42;
  const color = (project.settings.titleColor ?? '#ffffff').replace('#', '');
  const opacity = project.settings.titleBoxOpacity ?? 0.6;
  const yPct = project.settings.titleYPercent ?? 85;
  const yPos = Math.round((yPct / 100) * outH);
  return `drawtext=text='${escapedText}':fontfile='C\\:/Windows/Fonts/arial.ttf':fontsize=${fontSize}:fontcolor=0x${color}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@${opacity}:boxborderw=12`;
}

async function processSingleClip(
  inputPath: string,
  outputPath: string,
  project: Project
): Promise<void> {
  const { outW, outH } = getOutputDimensions(project);
  const borderPct = project.settings.borderWidthPercent / 100;
  const innerW = Math.round(outW * (1 - 2 * borderPct));
  const innerH = Math.round(outH * (1 - 2 * borderPct));

  const filters: string[] = [];
  filters.push(`scale=${innerW}:${innerH}:force_original_aspect_ratio=decrease`);
  filters.push(`pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black`);

  if (project.settings.titleText) {
    filters.push(buildDrawtext(project, outW, outH));
  }

  const filterStr = filters.join(',');

  const args = [
    '-y',
    '-i', inputPath,
    '-vf', filterStr,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-r', '30',
    '-movflags', '+faststart',
    outputPath,
  ];

  logger.info('Running FFmpeg for single clip processing');
  await runFFmpeg(args);
}

async function concatenateClips(
  inputPaths: string[],
  outputPath: string,
  project: Project
): Promise<void> {
  const { outW, outH } = getOutputDimensions(project);
  const borderPct = project.settings.borderWidthPercent / 100;
  const innerW = Math.round(outW * (1 - 2 * borderPct));
  const innerH = Math.round(outH * (1 - 2 * borderPct));
  const n = inputPaths.length;

  // First, probe each input to check for audio streams
  const hasAudioPerClip = await Promise.all(
    inputPaths.map(p => probeHasAudio(p))
  );
  const allHaveAudio = hasAudioPerClip.every(Boolean);

  // Build filter_complex
  const filterParts: string[] = [];

  // Scale/pad video and normalize audio for each input
  for (let i = 0; i < n; i++) {
    filterParts.push(
      `[${i}:v]scale=${innerW}:${innerH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1[v${i}]`
    );

    if (allHaveAudio) {
      // Normalize audio: resample to 44100Hz stereo so concat works across clips
      filterParts.push(
        `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
      );
    } else if (hasAudioPerClip[i]) {
      // Some clips have audio, some don't — generate silence for missing ones
      filterParts.push(
        `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
      );
    }
  }

  // If not all clips have audio, generate silence for those that don't
  if (!allHaveAudio) {
    for (let i = 0; i < n; i++) {
      if (!hasAudioPerClip[i]) {
        // Generate silent audio matching the clip's video duration
        filterParts.push(
          `anullsrc=r=44100:cl=stereo[anull${i}]`
        );
        // We need to trim it to match the video — use the video as reference
        // Actually, concat will handle duration alignment, but we need a finite source
        // Use aevalsrc with duration from the video
      }
    }
  }

  // Build concat inputs: interleave [v0][a0][v1][a1]...
  // For clips missing audio, we'll use a different strategy:
  // pre-process each clip to ensure it has audio via individual ffmpeg calls
  // This is simpler and more reliable than complex filter graphs

  if (!allHaveAudio) {
    // Pre-process: add silent audio to clips that are missing it
    const processedPaths = await ensureAllHaveAudio(inputPaths, hasAudioPerClip, project);
    // Recurse with processed paths (all will now have audio)
    await concatenateClips(processedPaths, outputPath, project);
    // Clean up temp files
    for (let i = 0; i < processedPaths.length; i++) {
      if (processedPaths[i] !== inputPaths[i]) {
        await fs.unlink(processedPaths[i]).catch(() => {});
      }
    }
    return;
  }

  // All clips have audio — build the concat filter
  // Clear filterParts and rebuild cleanly
  filterParts.length = 0;
  for (let i = 0; i < n; i++) {
    filterParts.push(
      `[${i}:v]scale=${innerW}:${innerH}:force_original_aspect_ratio=decrease,pad=${outW}:${outH}:(ow-iw)/2:(oh-ih)/2:black,setsar=1[v${i}]`
    );
    filterParts.push(
      `[${i}:a]aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo[a${i}]`
    );
  }

  const concatInputs = Array.from({ length: n }, (_, i) => `[v${i}][a${i}]`).join('');
  filterParts.push(`${concatInputs}concat=n=${n}:v=1:a=1[outv][outa]`);

  // Add text overlay
  if (project.settings.titleText) {
    filterParts.push(
      `[outv]${buildDrawtext(project, outW, outH)}[final]`
    );
  } else {
    filterParts.push(`[outv]null[final]`);
  }

  const filterComplex = filterParts.join('; ');

  const args: string[] = ['-y'];

  for (const inputPath of inputPaths) {
    args.push('-i', inputPath);
  }

  args.push('-filter_complex', filterComplex);
  args.push('-map', '[final]');
  args.push('-map', '[outa]');
  args.push(
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '23',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-r', '30',
    '-movflags', '+faststart',
    outputPath
  );

  logger.info(`Running FFmpeg to concatenate ${n} clips with audio`);
  await runFFmpeg(args);
}

async function probeHasAudio(filePath: string): Promise<boolean> {
  const ffprobePath = process.env.FFPROBE_PATH || 'ffprobe';
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      '-v', 'quiet',
      '-select_streams', 'a',
      '-show_entries', 'stream=codec_type',
      '-of', 'csv=p=0',
      filePath,
    ], { timeout: 15000 });
    return stdout.trim().includes('audio');
  } catch {
    return false;
  }
}

async function ensureAllHaveAudio(
  inputPaths: string[],
  hasAudioPerClip: boolean[],
  project: Project
): Promise<string[]> {
  const results: string[] = [];
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';

  for (let i = 0; i < inputPaths.length; i++) {
    if (hasAudioPerClip[i]) {
      results.push(inputPaths[i]);
    } else {
      // Add silent audio track to this clip
      const tempPath = inputPaths[i].replace(/\.mp4$/, '_withaudio.mp4');
      logger.info(`Adding silent audio to clip ${i}: ${inputPaths[i]}`);
      const args = [
        '-y',
        '-i', inputPaths[i],
        '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-shortest',
        tempPath,
      ];
      await runFFmpeg(args);
      results.push(tempPath);
    }
  }

  return results;
}

async function runFFmpeg(args: string[]): Promise<void> {
  const ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg';
  logger.debug(`FFmpeg args: ${args.join(' ')}`);

  try {
    const { stdout, stderr } = await execFileAsync(ffmpegPath, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: 300000,
    });
    if (stderr) logger.debug(`FFmpeg stderr: ${stderr.substring(0, 500)}`);
  } catch (error: any) {
    logger.error(`FFmpeg error: ${error.stderr?.substring(0, 500) || error.message}`);
    throw new Error(`FFmpeg failed: ${error.message}`);
  }
}

function escapeFFmpegText(text: string): string {
  return text
    .replace(/\\/g, '\\\\\\\\')
    .replace(/'/g, "'\\\\\\''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%');
}
