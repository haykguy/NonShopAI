import { useState, useRef } from 'react';
import {
  Sparkles, RotateCcw, Save, RefreshCw, ChevronRight,
  Upload, ToggleLeft, ToggleRight,
} from 'lucide-react';
import type { WizardState, ScriptClip } from './index';

// ── Prehook styles ────────────────────────────────────────────────────────────

const PREHOOK_OPTIONS = [
  {
    id: 'transformation' as const,
    label: 'Transformation',
    description: 'Show the dramatic before-and-after contrast to hook viewers instantly.',
  },
  {
    id: 'street-testimonial' as const,
    label: 'Street Testimonial',
    description: 'Candid on-the-street interview snippet that feels authentic and credible.',
  },
  {
    id: 'product-reveal' as const,
    label: 'Product Reveal',
    description: 'Cinematic product close-up that creates mystery and desire.',
  },
];

// ── Skeleton loader ───────────────────────────────────────────────────────────

function SkeletonBlock({ h = 20, w = '100%' }: { h?: number; w?: string }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: 6,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.05) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s linear infinite',
        marginBottom: 8,
      }}
    />
  );
}

// ── Clip editor panel ─────────────────────────────────────────────────────────

function ClipPanel({
  clip,
  index,
  onUpdate,
  onRegenerate,
}: {
  clip: ScriptClip;
  index: number;
  onUpdate: (updated: ScriptClip) => void;
  onRegenerate: (index: number) => void;
}) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px 20px',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.15))',
              border: '1px solid rgba(168,85,247,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: '#a855f7',
            }}
          >
            {index + 1}
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {clip.section_label || `Clip ${index + 1}`}
          </span>
        </div>
        <button
          onClick={() => onRegenerate(index)}
          title="Regenerate this clip"
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.03)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = '#a855f7';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.4)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          <RefreshCw size={12} strokeWidth={2} />
          Regen
        </button>
      </div>

      {/* Image prompt */}
      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
        Image Prompt
      </label>
      <textarea
        value={clip.image_prompt}
        onChange={e => onUpdate({ ...clip, image_prompt: e.target.value })}
        rows={3}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 12px',
          color: 'var(--text)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 12,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />

      {/* Video prompt */}
      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
        Video Prompt
      </label>
      <textarea
        value={clip.video_prompt}
        onChange={e => onUpdate({ ...clip, video_prompt: e.target.value })}
        rows={3}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.25)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '10px 12px',
          color: 'var(--text)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          lineHeight: 1.6,
          resize: 'vertical',
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 12,
          transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      />

      {/* Voice line (read-only) */}
      {clip.voice_line && (
        <>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
            Voice Line
          </label>
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(0,0,0,0.18)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--text-muted)',
              fontStyle: 'italic',
              lineHeight: 1.6,
            }}
          >
            {clip.voice_line}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step3Script ───────────────────────────────────────────────────────────────

interface Props {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onContinue: () => void;
}

export function Step3Script({ state, setState, onContinue }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const set = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState(prev => ({ ...prev, [key]: value }));

  // ── Generate script ──────────────────────────────────────────────────────
  async function handleGenerate() {
    set('isGeneratingScript', true);
    set('scriptError', null);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: state.selectedStyle?.name,
          product: state.selectedProduct?.name,
          productIngredients: state.selectedProduct?.key_ingredients,
          renderMode: state.renderMode,
          clipCount: state.selectedStyle?.default_clip_count ?? 7,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Script generation failed');
      setState(prev => ({ ...prev, script: data, isGeneratingScript: false }));
    } catch {
      // Fallback mock
      const mockClips: ScriptClip[] = Array.from({ length: 7 }, (_, i) => ({
        index: i,
        section_label: ['FEAR HOOK', 'PROBLEM AGITATE', 'SOLUTION REVEAL', 'PROOF', 'MECHANISM', 'CTA SOFT', 'CTA HARD'][i],
        image_prompt: `Cinematic shot ${i + 1} for ${state.selectedStyle?.name ?? 'video'} style. Photorealistic, high-quality lighting.`,
        video_prompt: `Camera slowly pushes in. Subject speaks directly to camera. ${state.renderMode === 'heygen-11labs' ? 'Talking head, mouth sync.' : 'Expressive gestures.'}`,
        voice_line: i < 3 ? `This is sample voice line ${i + 1} for clip ${i + 1}.` : undefined,
      }));
      setState(prev => ({
        ...prev,
        script: {
          script_text: `[Generated Script for ${state.selectedProduct?.name ?? 'product'} — ${state.selectedStyle?.name ?? 'style'}]\n\nHook: Are you still struggling with the problem that ${state.selectedProduct?.name ?? 'this product'} solves?\n\nAgitate: Every day you wait, the problem compounds...\n\nReveal: That's why we created ${state.selectedProduct?.name ?? 'this'}...\n\n[Continue with full script...]`,
          clips: mockClips,
        },
        isGeneratingScript: false,
        scriptError: null,
      }));
    }
  }

  // ── Improve script ───────────────────────────────────────────────────────
  async function handleImprove() {
    if (!state.script || !state.improvementFeedback.trim()) return;
    set('isGeneratingScript', true);
    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingScript: state.script.script_text,
          feedbackNotes: state.improvementFeedback,
          style: state.selectedStyle?.name,
          product: state.selectedProduct?.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(prev => ({ ...prev, script: data, isGeneratingScript: false }));
    } catch {
      set('isGeneratingScript', false);
    }
  }

  // ── Regenerate single clip ───────────────────────────────────────────────
  function handleRegenerateClip(index: number) {
    if (!state.script) return;
    const clip = state.script.clips[index];
    const updated: ScriptClip = {
      ...clip,
      image_prompt: `[Regenerated] ${clip.image_prompt}`,
    };
    const newClips = state.script.clips.map((c, i) => (i === index ? updated : c));
    setState(prev => ({
      ...prev,
      script: prev.script ? { ...prev.script, clips: newClips } : null,
    }));
  }

  // ── Update clip ──────────────────────────────────────────────────────────
  function handleUpdateClip(index: number, updated: ScriptClip) {
    if (!state.script) return;
    const newClips = state.script.clips.map((c, i) => (i === index ? updated : c));
    setState(prev => ({
      ...prev,
      script: prev.script ? { ...prev.script, clips: newClips } : null,
    }));
  }

  // ── Save script ──────────────────────────────────────────────────────────
  async function handleSave() {
    if (!state.script) return;
    setSaving(true);
    try {
      await fetch('/api/scripts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.script),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  // ── Parse pasted text ────────────────────────────────────────────────────
  function handleParseImport() {
    const lines = importText.split('\n').filter(l => l.trim());
    const clips: ScriptClip[] = lines.map((line, i) => ({
      index: i,
      image_prompt: `Clip ${i + 1} visual for: ${line.slice(0, 60)}`,
      video_prompt: line,
      voice_line: line,
    }));
    setState(prev => ({
      ...prev,
      script: { script_text: importText, clips },
    }));
  }

  // ── PDF upload ───────────────────────────────────────────────────────────
  async function handlePdfUpload(file: File) {
    const formData = new FormData();
    formData.append('pdf', file);
    try {
      const res = await fetch('/api/pdf/parse', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.script_text || data.clips) {
        setState(prev => ({
          ...prev,
          script: {
            script_text: data.script_text || importText,
            clips: data.clips || [],
          },
        }));
      }
    } catch {
      // ignore
    }
  }

  const canContinue = (state.script?.clips?.length ?? 0) > 0;

  // ── Tabs ─────────────────────────────────────────────────────────────────
  const tabs: Array<{ id: WizardState['scriptTab']; label: string }> = [
    { id: 'generate', label: 'Generate' },
    { id: 'improve', label: 'Improve' },
    { id: 'import', label: 'Import' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: 6,
            letterSpacing: '-0.01em',
          }}
        >
          Script
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Generate, refine, or import your video script and clip prompts.
        </p>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: 2,
          marginBottom: 28,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 4,
          width: 'fit-content',
        }}
      >
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => set('scriptTab', t.id)}
            style={{
              all: 'unset',
              padding: '7px 18px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: state.scriptTab === t.id ? 600 : 400,
              fontFamily: 'var(--font-body)',
              color: state.scriptTab === t.id ? '#fff' : 'var(--text-secondary)',
              background: state.scriptTab === t.id
                ? 'linear-gradient(135deg, #a855f7, #ec4899)'
                : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: state.scriptTab === t.id ? '0 2px 8px rgba(168,85,247,0.35)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: GENERATE ── */}
      {state.scriptTab === 'generate' && (
        <div>
          {/* Render mode toggle */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              marginBottom: 24,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 4,
              width: 'fit-content',
            }}
          >
            {(['veo-only', 'heygen-11labs'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => set('renderMode', mode)}
                style={{
                  all: 'unset',
                  padding: '7px 16px',
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: state.renderMode === mode ? 600 : 400,
                  fontFamily: 'var(--font-body)',
                  color: state.renderMode === mode ? '#fff' : 'var(--text-secondary)',
                  background: state.renderMode === mode ? 'rgba(168,85,247,0.25)' : 'transparent',
                  border: state.renderMode === mode ? '1px solid rgba(168,85,247,0.4)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'veo-only' ? 'Veo 3 Only' : 'Veo 3 + HeyGen + 11Labs'}
              </button>
            ))}
          </div>

          {/* Generate button or skeleton/result */}
          {!state.script && !state.isGeneratingScript && (
            <button
              onClick={handleGenerate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: '#fff',
                border: 'none',
                borderRadius: 14,
                fontSize: 15,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                boxShadow: '0 6px 28px rgba(168,85,247,0.40)',
                transition: 'opacity 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              }}
            >
              <Sparkles size={18} strokeWidth={2} />
              Generate Script
            </button>
          )}

          {/* Skeleton loader */}
          {state.isGeneratingScript && (
            <div>
              <div
                style={{
                  fontSize: 13,
                  color: '#a855f7',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#a855f7',
                    animation: 'pulse 1s ease-in-out infinite',
                  }}
                />
                Writing your script…
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonBlock key={i} h={i % 3 === 0 ? 14 : 20} w={i % 2 === 0 ? '80%' : '100%'} />
                  ))}
                </div>
                <div>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <SkeletonBlock h={16} w="60%" />
                      <SkeletonBlock h={60} />
                      <SkeletonBlock h={60} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Script result */}
          {state.script && !state.isGeneratingScript && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                {/* Left — script text */}
                <div>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Script Text
                  </label>
                  <textarea
                    value={state.script.script_text}
                    onChange={e =>
                      setState(prev => ({
                        ...prev,
                        script: prev.script ? { ...prev.script, script_text: e.target.value } : null,
                      }))
                    }
                    style={{
                      width: '100%',
                      minHeight: 480,
                      background: 'rgba(0,0,0,0.30)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      color: 'var(--text)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12.5,
                      lineHeight: 1.75,
                      resize: 'vertical',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>

                {/* Right — clips */}
                <div style={{ maxHeight: 540, overflowY: 'auto', paddingRight: 4 }}>
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Clip Breakdown ({state.script.clips.length} clips)
                  </label>
                  {state.script.clips.map((clip, i) => (
                    <ClipPanel
                      key={i}
                      clip={clip}
                      index={i}
                      onUpdate={updated => handleUpdateClip(i, updated)}
                      onRegenerate={handleRegenerateClip}
                    />
                  ))}
                </div>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '10px 20px',
                    background: saveSuccess ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.07)',
                    color: saveSuccess ? '#34d399' : 'var(--text)',
                    border: `1px solid ${saveSuccess ? 'rgba(52,211,153,0.4)' : 'var(--border)'}`,
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Save size={14} strokeWidth={2} />
                  {saveSuccess ? 'Saved!' : saving ? 'Saving…' : 'Save Script'}
                </button>
                <button
                  onClick={handleGenerate}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 500,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.35)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  }}
                >
                  <RotateCcw size={14} strokeWidth={2} />
                  Regenerate All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: IMPROVE ── */}
      {state.scriptTab === 'improve' && (
        <div>
          {!state.script ? (
            <div
              style={{
                padding: '40px 28px',
                background: 'var(--card)',
                border: '1px dashed var(--border)',
                borderRadius: 16,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 14,
                fontFamily: 'var(--font-body)',
              }}
            >
              Generate a script first before you can improve it.
            </div>
          ) : (
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                Current Script
              </label>
              <textarea
                readOnly
                value={state.script.script_text}
                rows={8}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.20)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12.5,
                  lineHeight: 1.75,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 20,
                }}
              />

              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                What should change?
              </label>
              <textarea
                value={state.improvementFeedback}
                onChange={e => set('improvementFeedback', e.target.value)}
                rows={4}
                placeholder="e.g. Make the hook more aggressive, shorten clip 3, add more fear..."
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: 16,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />

              <button
                onClick={handleImprove}
                disabled={state.isGeneratingScript || !state.improvementFeedback.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 24px',
                  background: state.isGeneratingScript || !state.improvementFeedback.trim()
                    ? 'rgba(168,85,247,0.15)'
                    : 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: state.isGeneratingScript || !state.improvementFeedback.trim() ? 'not-allowed' : 'pointer',
                  opacity: state.isGeneratingScript || !state.improvementFeedback.trim() ? 0.6 : 1,
                  transition: 'all 0.15s',
                  boxShadow: !state.isGeneratingScript && state.improvementFeedback.trim() ? '0 4px 18px rgba(168,85,247,0.35)' : 'none',
                }}
              >
                <Sparkles size={16} strokeWidth={2} />
                {state.isGeneratingScript ? 'Improving…' : 'Improve Script'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: IMPORT ── */}
      {state.scriptTab === 'import' && (
        <div>
          {/* PDF upload */}
          <div
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 14,
              padding: '32px 24px',
              textAlign: 'center',
              marginBottom: 24,
              transition: 'border-color 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.4)')}
            onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)')}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={28} color="var(--text-dim)" strokeWidth={1.5} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 6 }}>
              Drop a PDF or click to upload
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              .pdf files only
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
              }}
            />
          </div>

          {/* Or paste text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 16,
              color: 'var(--text-muted)',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            OR
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Paste Script Text
          </label>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={10}
            placeholder="Paste your script here. Each line or numbered section will become a clip..."
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '14px 16px',
              color: 'var(--text)',
              fontFamily: 'var(--font-mono)',
              fontSize: 12.5,
              lineHeight: 1.75,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 16,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />
          <button
            onClick={handleParseImport}
            disabled={!importText.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              background: importText.trim() ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.05)',
              color: importText.trim() ? '#a855f7' : 'var(--text-muted)',
              border: `1px solid ${importText.trim() ? 'rgba(168,85,247,0.4)' : 'var(--border)'}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: importText.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}
          >
            Parse Script
          </button>

          {state.script && (
            <div
              style={{
                marginTop: 20,
                padding: '14px 18px',
                background: 'rgba(52,211,153,0.10)',
                border: '1px solid rgba(52,211,153,0.30)',
                borderRadius: 10,
                fontSize: 13,
                color: '#34d399',
                fontFamily: 'var(--font-body)',
              }}
            >
              ✓ {state.script.clips.length} clips imported successfully
            </div>
          )}
        </div>
      )}

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'var(--border)', margin: '32px 0' }} />

      {/* ── Prehook section ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 4,
                letterSpacing: '-0.01em',
              }}
            >
              Add Prehook
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 420, margin: 0 }}>
              A 5–20 second intro clip that grabs attention before the main video.
            </p>
          </div>
          <button
            onClick={() => set('prehookEnabled', !state.prehookEnabled)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            {state.prehookEnabled ? (
              <ToggleRight size={32} color="#a855f7" />
            ) : (
              <ToggleLeft size={32} color="var(--text-dim)" />
            )}
          </button>
        </div>

        {state.prehookEnabled && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            {PREHOOK_OPTIONS.map(opt => {
              const isSelected = state.prehookStyle === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => set('prehookStyle', opt.id)}
                  style={{
                    all: 'unset',
                    flex: 1,
                    padding: '16px 18px',
                    background: isSelected ? 'rgba(168,85,247,0.12)' : 'var(--card)',
                    border: `1px solid ${isSelected ? '#a855f7' : 'var(--border)'}`,
                    borderRadius: 14,
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    boxShadow: isSelected ? '0 0 0 1px rgba(168,85,247,0.25)' : 'none',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      fontFamily: 'var(--font-body)',
                      color: isSelected ? '#a855f7' : 'var(--text)',
                      marginBottom: 5,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-body)',
                      lineHeight: 1.55,
                    }}
                  >
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Continue button ── */}
      {canContinue && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
          <button
            onClick={onContinue}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'opacity 0.15s',
              boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.88')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
          >
            Continue to Avatar
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
