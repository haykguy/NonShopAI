import fs from 'fs/promises';
import { logger } from '../utils/logger';

interface ParsedClip {
  imagePrompt: string;
  videoPrompt: string;
}

export async function parsePdf(filePath: string): Promise<ParsedClip[]> {
  // Dynamic import for pdf-parse (it uses require internally)
  const pdfParse = require('pdf-parse');

  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  const text: string = data.text;

  logger.info(`Parsed PDF: ${data.numpages} pages, ${text.length} chars`);

  return extractClipsFromText(text);
}

export function extractClipsFromText(text: string): ParsedClip[] {
  const clips: ParsedClip[] = [];

  // Strategy 1: Look for "CLIP N" sections with "IMAGE PROMPT" and "VIDEO PROMPT" labels
  const clipRegex = /CLIP\s+(\d+)[^\n]*\n([\s\S]*?)(?=CLIP\s+\d+|$)/gi;
  let match;

  while ((match = clipRegex.exec(text)) !== null) {
    const sectionText = match[2];
    const parsed = extractPromptsFromSection(sectionText);
    if (parsed) {
      clips.push(parsed);
    }
  }

  if (clips.length > 0) {
    logger.info(`Extracted ${clips.length} clips using CLIP N pattern`);
    return clips;
  }

  // Strategy 2: Look for "Scene N" pattern
  const sceneRegex = /Scene\s+(\d+)[^\n]*\n([\s\S]*?)(?=Scene\s+\d+|$)/gi;
  while ((match = sceneRegex.exec(text)) !== null) {
    const sectionText = match[2];
    const parsed = extractPromptsFromSection(sectionText);
    if (parsed) {
      clips.push(parsed);
    }
  }

  if (clips.length > 0) {
    logger.info(`Extracted ${clips.length} clips using Scene N pattern`);
    return clips;
  }

  // Strategy 3: Split by numbered sections (1., 2., etc.)
  const numberedRegex = /(?:^|\n)\s*(\d+)\.\s*([\s\S]*?)(?=\n\s*\d+\.\s|$)/g;
  while ((match = numberedRegex.exec(text)) !== null) {
    const sectionText = match[2];
    const parsed = extractPromptsFromSection(sectionText);
    if (parsed) {
      clips.push(parsed);
    }
  }

  if (clips.length > 0) {
    logger.info(`Extracted ${clips.length} clips using numbered pattern`);
    return clips;
  }

  logger.warn('Could not parse PDF into clips. Returning raw text as single clip.');
  return [{
    imagePrompt: text.substring(0, 500).trim(),
    videoPrompt: text.substring(0, 500).trim(),
  }];
}

function extractPromptsFromSection(section: string): ParsedClip | null {
  let imagePrompt = '';
  let videoPrompt = '';

  // Try labeled extraction: "IMAGE PROMPT" and "VIDEO PROMPT"
  const imageMatch = section.match(
    /IMAGE\s+PROMPT[^\n]*\n([\s\S]*?)(?=VIDEO\s+PROMPT|$)/i
  );
  const videoMatch = section.match(
    /VIDEO\s+PROMPT[^\n]*\n([\s\S]*?)$/i
  );

  if (imageMatch && videoMatch) {
    imagePrompt = cleanPrompt(imageMatch[1]);
    videoPrompt = cleanPrompt(videoMatch[1]);
  } else {
    // Try "Image:" and "Video:" or "Visual:" and "Script:"
    const imgAlt = section.match(/(?:Image|Visual):\s*([\s\S]*?)(?=(?:Video|Script|Action):)/i);
    const vidAlt = section.match(/(?:Video|Script|Action):\s*([\s\S]*?)$/i);

    if (imgAlt && vidAlt) {
      imagePrompt = cleanPrompt(imgAlt[1]);
      videoPrompt = cleanPrompt(vidAlt[1]);
    }
  }

  if (!imagePrompt && !videoPrompt) return null;

  return { imagePrompt, videoPrompt };
}

function cleanPrompt(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/^[-–—•]\s*/gm, '')
    .trim();
}
