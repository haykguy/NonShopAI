export type PrehookStyle = 'transformation' | 'street-testimonial' | 'product-reveal';

export interface PrehookClip {
  clip_number: number;
  timestamp: string;
  section: string;
  image_prompt: string;
  video_prompt: string;
  voice_line: string;
}

export interface PrehookResult {
  clips: [PrehookClip, PrehookClip];
}

interface Product {
  name: string;
  target_audience: string;
}

// Extract the first pain-point phrase from target_audience (e.g. "brain fog" from long string)
function extractPainPoint(targetAudience: string): string {
  const match = targetAudience.match(/experiencing ([^,.(]+)/i);
  if (match) return match[1].trim().toLowerCase();
  // Fallback: grab first notable phrase after age-group clause
  const parts = targetAudience.split(/concerned about|interested in|experiencing/i);
  if (parts.length > 1) return parts[1].split(',')[0].trim().toLowerCase();
  return 'this problem';
}

export function generatePrehookClips(
  style: PrehookStyle,
  product: Product,
  avatarDescription: string,
): PrehookResult {
  const painPoint = extractPainPoint(product.target_audience);

  switch (style) {
    case 'transformation': {
      const clip1: PrehookClip = {
        clip_number: 1,
        timestamp: '0-8s',
        section: 'PREHOOK — BEFORE',
        image_prompt: `Photorealistic ${avatarDescription}, BEFORE state: tired, skin issues visible, concerned expression, bathroom mirror selfie style, natural harsh lighting showing imperfections, 9:16 vertical`,
        video_prompt: `Person looks at camera with worried expression, touches face gently, sighs. Character speaks ALL THE WORDS: "I've been struggling with ${painPoint} for years. I'm starting something new and I'll report back in 60 days."`,
        voice_line: `I've been struggling with ${painPoint} for years. I'm starting something new and I'll report back in 60 days.`,
      };
      const clip2: PrehookClip = {
        clip_number: 2,
        timestamp: '8-16s',
        section: 'PREHOOK — AFTER',
        image_prompt: `Photorealistic ${avatarDescription}, AFTER state: glowing healthy skin, confident happy expression, same bathroom mirror selfie style, warm flattering lighting, visible transformation, 9:16 vertical`,
        video_prompt: `Person smiles confidently at camera, touches face showing smooth skin, excited energy. Character speaks ALL THE WORDS: "60 days later. You are not going to believe what happened."`,
        voice_line: `60 days later. You are not going to believe what happened.`,
      };
      return { clips: [clip1, clip2] };
    }

    case 'street-testimonial': {
      const clip1: PrehookClip = {
        clip_number: 1,
        timestamp: '0-8s',
        section: 'PREHOOK — SURPRISE',
        image_prompt: `${avatarDescription} being interviewed on city street, RØDE microphone in frame, surprised expression, urban background, 9:16 vertical`,
        video_prompt: `Person being interviewed looks surprised and leans toward microphone. Character speaks ALL THE WORDS: "Wait, you want me to share my actual secret? Nobody asks me this."`,
        voice_line: `Wait, you want me to share my actual secret? Nobody asks me this.`,
      };
      const clip2: PrehookClip = {
        clip_number: 2,
        timestamp: '8-16s',
        section: 'PREHOOK — INTRIGUE',
        image_prompt: `${avatarDescription} on city street, now smiling knowingly at interviewer, confident body language, microphone visible, 9:16 vertical`,
        video_prompt: `Person smiles and nods knowingly. Character speaks ALL THE WORDS: "Fine. But most people are going to be shocked by this."`,
        voice_line: `Fine. But most people are going to be shocked by this.`,
      };
      return { clips: [clip1, clip2] };
    }

    case 'product-reveal': {
      const clip1: PrehookClip = {
        clip_number: 1,
        timestamp: '0-8s',
        section: 'PREHOOK — REVEAL',
        image_prompt: `${avatarDescription} holding supplement bottle with both hands presenting to camera, bright clean background, excited expression, 9:16 vertical`,
        video_prompt: `Person holds bottle up to camera with both hands, excited expression. Character speaks ALL THE WORDS: "I finally found it. After two years of research this is the one."`,
        voice_line: `I finally found it. After two years of research this is the one.`,
      };
      const clip2: PrehookClip = {
        clip_number: 2,
        timestamp: '8-16s',
        section: 'PREHOOK — SETUP',
        image_prompt: `${avatarDescription} close up of supplement bottle being turned to show label, bright clean background, engaged expression, 9:16 vertical`,
        video_prompt: `Person turns bottle slowly to show label to camera, deliberate motion. Character speaks ALL THE WORDS: "Let me explain exactly why this changes everything."`,
        voice_line: `Let me explain exactly why this changes everything.`,
      };
      return { clips: [clip1, clip2] };
    }

    default:
      throw new Error(`Unknown prehook style: ${style}`);
  }
}
