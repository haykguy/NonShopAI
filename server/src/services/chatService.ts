export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  systemPrompt: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  generatedPrompts?: Array<{ imagePrompt: string; videoPrompt: string }>;
}

export interface LlmAdapter {
  chat(req: ChatRequest): Promise<ChatResponse>;
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

export interface SystemPromptContext {
  projectTitle: string;
  clipCount: number;
  existingPrompts: Array<{ imagePrompt: string; videoPrompt: string }>;
}

export function buildSystemPrompt(ctx: SystemPromptContext): string {
  const existingBlock =
    ctx.existingPrompts.some(p => p.imagePrompt || p.videoPrompt)
      ? `\nExisting clip prompts (already filled — preserve or improve them):\n` +
        ctx.existingPrompts
          .map(
            (p, i) =>
              `  Clip ${i + 1}: image="${p.imagePrompt || '(empty)'}" | video="${p.videoPrompt || '(empty)'}"`,
          )
          .join('\n')
      : '';

  return `You are an expert video prompt generation assistant for a tool that creates AI videos.
The tool uses two AI models:
  - Nano Banana Pro (image generation): Generates photorealistic portrait-aspect images.
    Best prompts: 20–60 words, include subject, setting, lighting quality, color palette,
    photographic style (e.g. "wide angle", "close-up", "aerial", "shallow depth of field").
    Example: "Professional woman presenting at a modern conference room, warm studio lighting,
    soft blue tones, sharp focus, cinematic wide angle lens."
  - Veo 3.1-Fast (video generation): Animates images into short clips.
    Best prompts: 5–20 words using camera motion verbs + subject action.
    Example: "Slow dolly forward as presenter gestures toward screen, confident energy."

PROJECT CONTEXT:
  Title: "${ctx.projectTitle}"
  Number of clips to generate: ${ctx.clipCount}${existingBlock}

INTERVIEW RULES:
  1. Conduct a structured interview by asking ONE question at a time.
  2. Follow this exact phase order:
     - Phase 0: Ask about the main topic/subject of the video.
     - Phase 1: Ask about the target audience and desired tone.
     - Phase 2: Ask about the visual style.
     - Phase 3: Ask about key scenes or narrative beats (list them for ${ctx.clipCount} clips).
     - Phase 4: Generate prompts and output a JSON code fence (see format below).
  3. Keep questions short and clear. Offer example answers in parentheses.
  4. When all questions are answered (after Phase 3), output the prompts in this exact format:

\`\`\`json
{
  "generatedPrompts": [
    { "imagePrompt": "...", "videoPrompt": "..." }
  ]
}
\`\`\`

  5. The generatedPrompts array MUST have exactly ${ctx.clipCount} items.
  6. Do NOT output the JSON block until you have answers for all four phases.
  7. After outputting the JSON block, briefly describe what you created.`;
}

// ─── JSON Extractor ───────────────────────────────────────────────────────────

export function extractGeneratedPrompts(
  text: string,
): Array<{ imagePrompt: string; videoPrompt: string }> | undefined {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (
      parsed &&
      Array.isArray(parsed.generatedPrompts) &&
      parsed.generatedPrompts.every(
        (p: any) =>
          typeof p.imagePrompt === 'string' && typeof p.videoPrompt === 'string',
      )
    ) {
      return parsed.generatedPrompts;
    }
  } catch {
    // malformed JSON — ignore
  }
  return undefined;
}

// ─── Mock Adapter ─────────────────────────────────────────────────────────────

const INTERVIEW_QUESTIONS = [
  (clipCount: number) =>
    `Hello! I'll help you write prompts for your ${clipCount}-clip video. Let's start — what is the main topic or subject of this video? (For example: a product launch, a travel destination, a tutorial, an ad campaign.)`,
  () =>
    `Got it! Who is the target audience, and what tone should the video have? (For example: professional/corporate, cinematic/dramatic, upbeat/energetic, calm/educational, playful/fun.)`,
  () =>
    `Great. What visual style fits best? (For example: photorealistic footage, dark and moody, bright and airy, minimal/clean, documentary style, illustrated/artistic.)`,
  (clipCount: number) =>
    `Almost there! Describe the key scenes or moments you want the video to cover — ideally ${clipCount} distinct beats. You can list them briefly and I'll craft the prompts.`,
];

class MockAdapter implements LlmAdapter {
  async chat(req: ChatRequest): Promise<ChatResponse> {
    const userTurns = req.messages.filter(m => m.role === 'user').length;

    // Extract clip count from system prompt
    const countMatch = req.systemPrompt.match(/Number of clips to generate: (\d+)/);
    const clipCount = countMatch ? parseInt(countMatch[1], 10) : 3;

    // Phases 0–3: ask the interview questions
    if (userTurns < INTERVIEW_QUESTIONS.length) {
      const question = INTERVIEW_QUESTIONS[userTurns](clipCount);
      return { message: question };
    }

    // Phase 4+: collect answers and generate prompts
    const userAnswers = req.messages
      .filter(m => m.role === 'user')
      .map(m => m.content);

    const topic = userAnswers[0] || 'a compelling video';
    const tone = userAnswers[1] || 'professional and cinematic';
    const style = userAnswers[2] || 'photorealistic, clean';
    const scenes = userAnswers[3] || '';

    // Build clip prompts from the answers
    const sceneList = scenes
      .split(/[,.\n]+/)
      .map(s => s.trim())
      .filter(Boolean);

    const prompts = Array.from({ length: clipCount }, (_, i) => {
      const scene = sceneList[i] || `${topic} — moment ${i + 1}`;
      const imagePrompt = `${scene}, ${style} visual style, ${tone} tone, portrait aspect ratio, cinematic lighting, sharp focus`.replace(
        /,\s*,/g,
        ',',
      );
      const videoPrompt = `Slow cinematic pan across ${scene}, ${tone} energy`.substring(0, 80);
      return { imagePrompt, videoPrompt };
    });

    const jsonBlock =
      '```json\n' +
      JSON.stringify({ generatedPrompts: prompts }, null, 2) +
      '\n```';

    const message = `Perfect! I've created ${clipCount} clip prompts based on your description of "${topic}" with a ${tone} feel and ${style} visual style.\n\n${jsonBlock}\n\nYou can click **Apply Prompts to Clips** to populate all the clip fields, then review and tweak any individual prompt before starting generation.`;

    const generatedPrompts = extractGeneratedPrompts(message);
    return { message, generatedPrompts };
  }
}

// ─── OpenAI Adapter Skeleton (activate with LLM_PROVIDER=openai) ──────────────

class OpenAiAdapter implements LlmAdapter {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: req.systemPrompt },
        ...req.messages,
      ],
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as any;
    const text: string = data.choices?.[0]?.message?.content ?? '';
    const generatedPrompts = extractGeneratedPrompts(text);
    return { message: text, generatedPrompts };
  }
}

// ─── Anthropic Adapter Skeleton (activate with LLM_PROVIDER=anthropic) ────────

class AnthropicAdapter implements LlmAdapter {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const body = {
      model: this.model,
      max_tokens: 2048,
      system: req.systemPrompt,
      messages: req.messages.filter(m => m.role !== 'system'),
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as any;
    const text: string = data.content?.[0]?.text ?? '';
    const generatedPrompts = extractGeneratedPrompts(text);
    return { message: text, generatedPrompts };
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createLlmAdapter(): LlmAdapter {
  const provider = process.env.LLM_PROVIDER || 'mock';
  const apiKey = process.env.LLM_API_KEY || '';
  const model = process.env.LLM_MODEL || '';

  if (provider === 'openai') {
    return new OpenAiAdapter(apiKey, model || 'gpt-4o-mini');
  }
  if (provider === 'anthropic') {
    return new AnthropicAdapter(apiKey, model || 'claude-haiku-4-5-20251001');
  }
  return new MockAdapter();
}

export const llmAdapter = createLlmAdapter();
