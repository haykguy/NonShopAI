import { db } from '../db';
import { config } from '../config';

export type RenderMode = 'veo-only' | 'heygen-11labs';

export interface ScriptClip {
  clip_number: number;
  timestamp: string;
  section: string;
  image_prompt: string;
  video_prompt: string;
  voice_line: string;
}

export interface GeneratedScript {
  script_text: string;
  clips: ScriptClip[];
  saveScript: boolean;
}

interface Product {
  id: number;
  name: string;
  key_ingredients: string;
  marketing_angle: string;
  target_audience: string;
}

interface VideoStyle {
  id: number;
  name: string;
  description: string;
  clip_count_default: number;
  image_prompt_style: string;
}

function buildSystemPrompt(
  product: Product,
  videoStyle: VideoStyle,
  renderMode: RenderMode,
): string {
  return `You are an expert social media video scriptwriter specializing in short-form health supplement content for TikTok and Instagram.

You write in a direct, conversational, slightly alarming tone that hooks viewers immediately. You use Cashvertising principles: fear of loss, social proof, secret information, us vs them framing, and specific numbers over vague claims.

PRODUCT: ${product.name}
KEY INGREDIENTS: ${product.key_ingredients}
CORE MARKETING ANGLE: ${product.marketing_angle}
TARGET AUDIENCE: ${product.target_audience}

VIDEO STYLE: ${videoStyle.name}
STYLE DESCRIPTION: ${videoStyle.description}
DEFAULT CLIP COUNT: ${videoStyle.clip_count_default}
RENDER MODE: ${renderMode}

SCRIPT STRUCTURE FOR THIS STYLE:
- Clip 1 (0-8s): FEAR HOOK — Open with a shocking or alarming statement about a problem the viewer has right now. Make them feel it personally.
- Clip 2 (8-16s): SPECIFIC PROBLEM — Name the exact biological or chemical reason this problem happens. Use a specific number or statistic. Make it sound scientific but digestible.
- Clip 3 (16-24s): FAILED SOLUTIONS — Call out what they've already tried that isn't working. Validate their frustration. Name specific products or habits they've wasted money on.
- Clip 4 (24-32s): CONSEQUENCES — Paint the picture of what happens if they keep ignoring this. Social, professional, physical consequences. Make it vivid.
- Clip 5 (32-40s): TRANSITION TO SOLUTION — Hint that there IS a solution but create a price comparison or complexity problem with existing alternatives first.
- Clip 6 (40-48s): THE SOLUTION — Introduce the product by name. Specific claim. Specific price. Specific benefit. Why this one over others.
- Clip 7 (48-56s): VICTORY + CTA — Show the transformation. Create urgency (limited stock, first X orders). Tell them exactly what to do (link in bio, comment "link").

RENDER MODE INSTRUCTIONS:
If render mode is "veo-only": Each clip needs an IMAGE PROMPT for Nano Banana Pro and a VIDEO PROMPT for Veo 3. The avatar is a photorealistic person. The video prompt must end with 'Character speaks ALL THE WORDS: "[the exact dialogue for this clip]"'. The image prompt style should match: ${videoStyle.image_prompt_style}

If render mode is "heygen-11labs": Each clip needs an IMAGE PROMPT for Nano Banana Pro and a VIDEO PROMPT for Veo 3 (avatar motion only, no dialogue). Also include a VOICE LINE field with the exact words for ElevenLabs TTS.

OUTPUT FORMAT — respond with ONLY this JSON, no other text:
{
  "script_text": "full script as flowing prose",
  "clips": [
    {
      "clip_number": 1,
      "timestamp": "0-8s",
      "section": "FEAR HOOK",
      "image_prompt": "...",
      "video_prompt": "...",
      "voice_line": "..."
    }
  ]
}`;
}

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  model: string,
  maxTokens: number = 4000,
): Promise<string> {
  const apiKey = config.llmApiKey || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) {
    throw new Error('No Anthropic API key configured. Set LLM_API_KEY or ANTHROPIC_API_KEY in .env');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as any;
  return data.content?.[0]?.text ?? '';
}

function parseScriptJson(text: string): GeneratedScript | null {
  // Strip markdown code fences if present
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  try {
    const parsed = JSON.parse(stripped);
    if (
      typeof parsed.script_text === 'string' &&
      Array.isArray(parsed.clips)
    ) {
      return { ...parsed, saveScript: false };
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateScript(opts: {
  productId: number;
  videoStyleId: number;
  renderMode: RenderMode;
  existingScript?: string;
  feedbackNotes?: string;
}): Promise<GeneratedScript> {
  const { productId, videoStyleId, renderMode, existingScript, feedbackNotes } = opts;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Product | undefined;
  if (!product) throw new Error(`Product ${productId} not found`);

  const videoStyle = db.prepare('SELECT * FROM video_styles WHERE id = ?').get(videoStyleId) as VideoStyle | undefined;
  if (!videoStyle) throw new Error(`Video style ${videoStyleId} not found`);

  const isImprovementMode = !!(existingScript && feedbackNotes);
  const model = isImprovementMode ? 'claude-haiku-4-5-20251001' : 'claude-opus-4-6';
  const systemPrompt = buildSystemPrompt(product, videoStyle, renderMode);

  const userMessage = isImprovementMode
    ? `Here is an existing script: ${existingScript}\n\nFeedback and requested changes: ${feedbackNotes}\n\nRewrite the script incorporating this feedback. Keep what works. Fix what doesn't. Return the same JSON format.`
    : `Generate a complete ${videoStyle.clip_count_default}-clip video script for ${product.name} using the ${videoStyle.name} style. Target audience: ${product.target_audience}. Render mode: ${renderMode}. Return only the JSON object specified in the system prompt.`;

  let text = await callAnthropic(systemPrompt, userMessage, model, 4000);
  let result = parseScriptJson(text);

  if (!result) {
    // Retry once with explicit JSON instruction
    text = await callAnthropic(
      systemPrompt,
      userMessage + '\n\nYou must respond with only valid JSON.',
      model,
      4000,
    );
    result = parseScriptJson(text);
  }

  if (!result) {
    throw new Error('Failed to parse script JSON from AI response after retry');
  }

  return result;
}
