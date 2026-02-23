import { useState } from 'react';
import { CheckIcon } from 'lucide-react';
import { Step1Style } from './Step1Style';
import { Step2Product } from './Step2Product';
import { Step3Script } from './Step3Script';
import { Step4Avatar } from './Step4Avatar';
import { Step5Review } from './Step5Review';

// ── Types ────────────────────────────────────────────────────────────────────

export interface VideoStyle {
  id: string;
  name: string;
  description: string;
  example_image_path?: string;
  default_clip_count?: number;
  category?: string;
}

export interface Product {
  id: string;
  name: string;
  key_ingredients?: string;
  marketing_angle?: string;
}

export interface ScriptClip {
  index: number;
  section_label?: string;
  image_prompt: string;
  video_prompt: string;
  voice_line?: string;
}

export interface Script {
  script_text: string;
  clips: ScriptClip[];
}

export interface Avatar {
  id: string;
  name: string;
  image_url?: string;
  style_tags?: string[];
  voice_label?: string;
  voice_id?: string;
  account_id?: string;
}

export type RenderMode = 'veo-only' | 'heygen-11labs';
export type PrehookStyle = 'transformation' | 'street-testimonial' | 'product-reveal';
export type ScriptTab = 'generate' | 'improve' | 'import';

export interface WizardState {
  currentStep: number;
  selectedStyle: VideoStyle | null;
  selectedProduct: Product | null;
  script: Script | null;
  scriptTab: ScriptTab;
  improvementFeedback: string;
  prehookEnabled: boolean;
  prehookStyle: PrehookStyle;
  selectedAvatar: Avatar | null;
  renderMode: RenderMode;
  isGeneratingScript: boolean;
  scriptError: string | null;
}

// ── Helper: Apply avatar context to script prompts ────────────────────────────

function applyAvatarToScript(avatar: Avatar | null, script: Script | null): Script | null {
  if (!script || !avatar || !avatar.image_url) {
    return script;
  }

  // Detect gender from style_tags (first element is typically the gender)
  const genderTag = avatar.style_tags?.[0]?.toLowerCase() || '';
  let pronoun = 'They say';
  if (genderTag === 'female') {
    pronoun = 'She says';
  } else if (genderTag === 'male') {
    pronoun = 'He says';
  }

  // Update each clip's video_prompt to include the voice line and pronoun
  const updatedClips = script.clips.map(clip => {
    if (!clip.voice_line) {
      return clip;
    }
    return {
      ...clip,
      video_prompt: `${pronoun}: "${clip.voice_line}". ${clip.video_prompt}`,
    };
  });

  return {
    ...script,
    clips: updatedClips,
  };
}

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEPS = ['Style', 'Product', 'Script', 'Avatar', 'Generate'];

function StepProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0,
        marginBottom: 48,
        position: 'relative',
      }}
    >
      {STEPS.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Node */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${
                    isCompleted
                      ? '#a855f7'
                      : isActive
                      ? '#a855f7'
                      : 'rgba(255,255,255,0.12)'
                  }`,
                  background: isCompleted
                    ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                    : isActive
                    ? 'rgba(168,85,247,0.18)'
                    : 'rgba(255,255,255,0.04)',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  zIndex: 2,
                  boxShadow: isActive
                    ? '0 0 0 4px rgba(168,85,247,0.18)'
                    : 'none',
                }}
              >
                {isCompleted ? (
                  <CheckIcon size={16} color="#fff" strokeWidth={2.5} />
                ) : (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: isActive ? '#a855f7' : 'var(--text-dim)',
                    }}
                  >
                    {stepNum}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  color: isActive ? 'var(--text)' : isCompleted ? '#a855f7' : 'var(--text-muted)',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                style={{
                  width: 80,
                  height: 2,
                  marginBottom: 20,
                  background: isCompleted
                    ? 'linear-gradient(90deg, #a855f7, #ec4899)'
                    : 'rgba(255,255,255,0.08)',
                  transition: 'background 0.3s ease',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Wizard root ───────────────────────────────────────────────────────────────

export function TopOfFunnelPage() {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    selectedStyle: null,
    selectedProduct: null,
    script: null,
    scriptTab: 'generate',
    improvementFeedback: '',
    prehookEnabled: false,
    prehookStyle: 'transformation',
    selectedAvatar: null,
    renderMode: 'veo-only',
    isGeneratingScript: false,
    scriptError: null,
  });

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState(prev => ({ ...prev, [key]: value }));

  const goTo = (step: number) => set('currentStep', step);
  const next = () => set('currentStep', Math.min(state.currentStep + 1, 5));
  const back = () => set('currentStep', Math.max(state.currentStep - 1, 1));

  return (
    <div className="page-content">
      {/* Page title */}
      <div className="animate-fade-up" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 6,
          }}
        >
          {state.currentStep > 1 && (
            <button
              onClick={back}
              style={{
                all: 'unset',
                cursor: 'pointer',
                fontSize: 13,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 0',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
            >
              ← Back
            </button>
          )}
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            marginBottom: 4,
          }}
        >
          Top of Funnel
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Photorealistic talking-head videos built from a script and style.
        </p>
      </div>

      {/* Step progress bar */}
      <StepProgressBar currentStep={state.currentStep} />

      {/* Step content */}
      <div className="animate-fade-up delay-1">
        {state.currentStep === 1 && (
          <Step1Style
            selected={state.selectedStyle}
            onSelect={style => set('selectedStyle', style)}
            onContinue={next}
          />
        )}
        {state.currentStep === 2 && (
          <Step2Product
            selected={state.selectedProduct}
            onSelect={product => set('selectedProduct', product)}
            onContinue={next}
          />
        )}
        {state.currentStep === 3 && (
          <Step3Script
            state={state}
            setState={setState}
            onContinue={next}
          />
        )}
        {state.currentStep === 4 && (
          <Step4Avatar
            selected={state.selectedAvatar}
            renderMode={state.renderMode}
            onSelect={avatar => set('selectedAvatar', avatar)}
            onContinue={() => {
              // Apply avatar context (gender, voice line) to script prompts before advancing
              const updatedScript = applyAvatarToScript(state.selectedAvatar, state.script);
              set('script', updatedScript);
              next();
            }}
          />
        )}
        {state.currentStep === 5 && (
          <Step5Review
            state={state}
            onEdit={() => goTo(1)}
          />
        )}
      </div>
    </div>
  );
}
