import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronDown, ChevronUp, Edit2, Zap, UserCircle2 } from 'lucide-react';
import type { WizardState } from './index';

// ── Label map for prehook ──────────────────────────────────────────────────────

const PREHOOK_LABELS: Record<string, string> = {
  'transformation': 'Transformation',
  'street-testimonial': 'Street Testimonial',
  'product-reveal': 'Product Reveal',
};

// ── Section card wrapper ───────────────────────────────────────────────────────

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.025)',
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: '18px 20px' }}>{children}</div>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        paddingBottom: 12,
        marginBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div style={{ width: 110, flexShrink: 0, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', paddingTop: 2 }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

function Badge({ children, color = 'purple' }: { children: React.ReactNode; color?: 'purple' | 'teal' | 'gray' }) {
  const colors = {
    purple: { bg: 'rgba(168,85,247,0.15)', text: '#a855f7', border: 'rgba(168,85,247,0.30)' },
    teal:   { bg: 'rgba(20,184,166,0.15)', text: '#14b8a6', border: 'rgba(20,184,166,0.30)' },
    gray:   { bg: 'rgba(255,255,255,0.07)', text: 'var(--text-muted)', border: 'var(--border)' },
  };
  const c = colors[color];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-mono)',
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {children}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  state: WizardState;
  onEdit: () => void;
}

export function Step5Review({ state, onEdit }: Props) {
  const navigate = useNavigate();
  const [scriptExpanded, setScriptExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectedStyle, selectedProduct, script, selectedAvatar, renderMode, prehookEnabled, prehookStyle } = state;

  // ── Cost + time estimates ─────────────────────────────────────────────────
  const clipCount = script?.clips?.length ?? 0;
  const prehookCost  = prehookEnabled ? 0.40 : 0;
  const heygenCost   = renderMode === 'heygen-11labs' ? 0.50 : 0;
  const estimatedCost = (clipCount * 0.20) + prehookCost + heygenCost;
  const estimatedMins = (clipCount * 2.5) + (prehookEnabled ? 5 : 0);

  // ── Script preview ────────────────────────────────────────────────────────
  const scriptPreviewLines = script?.script_text
    ? script.script_text.split('\n').filter(l => l.trim()).slice(0, 3)
    : [];

  // ── Start generation ──────────────────────────────────────────────────────
  async function handleStartGeneration() {
    setIsSubmitting(true);
    setError(null);
    try {
      // Build prehook clip if needed
      const prehookClip = prehookEnabled
        ? [{
            index: 0,
            imagePrompt: `Prehook: ${PREHOOK_LABELS[prehookStyle]} style for ${selectedProduct?.name ?? 'product'}. Cinematic, high-energy.`,
            videoPrompt: `Fast-cut ${prehookStyle} prehook. 5-10 seconds. Hooks viewer immediately.`,
            status: 'pending',
            retryCount: 0,
          }]
        : [];

      const scriptClips = (script?.clips ?? []).map((c, i) => ({
        index: prehookClip.length + i,
        imagePrompt: c.image_prompt,
        videoPrompt: c.video_prompt,
        status: 'pending',
        retryCount: 0,
      }));

      const allClips = [...prehookClip, ...scriptClips];

      // Create project
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${selectedStyle?.name ?? 'Video'} — ${selectedProduct?.name ?? 'Product'}`,
          clipCount: allClips.length,
          settings: {
            aspectRatio: '9:16',
            autoPickImage: true,
          },
          clips: allClips,
        }),
      });
      const project = await projectRes.json();
      if (!projectRes.ok) throw new Error(project.error || 'Failed to create project');

      // Pre-create metadata
      await fetch('/api/video-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          product_id: selectedProduct?.id,
          video_style_id: selectedStyle?.id,
          avatar_id: selectedAvatar?.id,
          render_mode: renderMode,
          prehook_enabled: prehookEnabled,
          prehook_style: prehookEnabled ? prehookStyle : null,
        }),
      }).catch(() => {/* non-critical */});

      // Start generation
      await fetch(`/api/projects/${project.id}/generate`, { method: 'POST' });

      // Navigate to project dashboard
      navigate('/pixar-ai', { state: { projectId: project.id } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>
          Review & Generate
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Double-check everything before kicking off generation.
        </p>
      </div>

      {/* ── Configuration ── */}
      <ReviewSection title="Configuration">
        <ReviewRow label="Style">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            {selectedStyle?.name ?? '—'}
          </span>
        </ReviewRow>
        <ReviewRow label="Product">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
            {selectedProduct?.name ?? '—'}
          </span>
        </ReviewRow>
        <ReviewRow label="Render Mode">
          <Badge color={renderMode === 'heygen-11labs' ? 'purple' : 'teal'}>
            {renderMode === 'veo-only' ? 'Veo 3 Only' : 'Veo 3 + HeyGen + 11Labs'}
          </Badge>
        </ReviewRow>
        <ReviewRow label="Prehook">
          {prehookEnabled ? (
            <Badge color="purple">{PREHOOK_LABELS[prehookStyle]}</Badge>
          ) : (
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>None</span>
          )}
        </ReviewRow>
      </ReviewSection>

      {/* ── Avatar ── */}
      <ReviewSection title="Avatar">
        {selectedAvatar ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {selectedAvatar.image_url ? (
              <img
                src={selectedAvatar.image_url}
                alt={selectedAvatar.name}
                style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: '1px solid var(--border)' }}
              />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCircle2 size={28} color="rgba(168,85,247,0.6)" strokeWidth={1.5} />
              </div>
            )}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
                {selectedAvatar.name}
              </div>
              {renderMode === 'heygen-11labs' && selectedAvatar.voice_label && (
                <div style={{ fontSize: 12, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                  🎙 {selectedAvatar.voice_label}
                </div>
              )}
              {selectedAvatar.style_tags && selectedAvatar.style_tags.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                  {selectedAvatar.style_tags.map(tag => (
                    <span key={tag} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>No avatar selected</span>
        )}
      </ReviewSection>

      {/* ── Script Preview ── */}
      <ReviewSection title="Script Preview">
        {script ? (
          <div>
            {/* First 3 lines */}
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(0,0,0,0.22)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                lineHeight: 1.75,
                color: 'var(--text-secondary)',
                marginBottom: 12,
              }}
            >
              {scriptPreviewLines.map((line, i) => (
                <div key={i} style={{ marginBottom: i < scriptPreviewLines.length - 1 ? 6 : 0 }}>
                  {line}
                </div>
              ))}
              {!scriptExpanded && script.script_text.split('\n').filter(l => l.trim()).length > 3 && (
                <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 6 }}>…</div>
              )}
              {scriptExpanded && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  {script.script_text.split('\n').filter(l => l.trim()).slice(3).map((line, i) => (
                    <div key={i} style={{ marginBottom: 6 }}>{line}</div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setScriptExpanded(v => !v)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  color: '#a855f7',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 500,
                }}
              >
                {scriptExpanded ? <ChevronUp size={14} strokeWidth={2} /> : <ChevronDown size={14} strokeWidth={2} />}
                {scriptExpanded ? 'Collapse script' : 'View full script'}
              </button>
              <Badge color="gray">{clipCount} clips</Badge>
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>No script generated</span>
        )}
      </ReviewSection>

      {/* ── Estimates ── */}
      <ReviewSection title="Estimated Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div
            style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(236,72,153,0.05))',
              border: '1px solid rgba(168,85,247,0.18)',
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Estimated Cost
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#a855f7', letterSpacing: '-0.02em', lineHeight: 1 }}>
              ${estimatedCost.toFixed(2)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
              {clipCount} clips × $0.20{prehookEnabled ? ' + $0.40 prehook' : ''}{renderMode === 'heygen-11labs' ? ' + $0.50 HeyGen' : ''}
            </div>
          </div>
          <div
            style={{
              padding: '16px 18px',
              background: 'linear-gradient(135deg, rgba(20,184,166,0.08), rgba(59,130,246,0.05))',
              border: '1px solid rgba(20,184,166,0.18)',
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              Estimated Time
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#14b8a6', letterSpacing: '-0.02em', lineHeight: 1 }}>
              ~{Math.round(estimatedMins)} min
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
              {clipCount} clips × 2.5 min{prehookEnabled ? ' + 5 min prehook' : ''}
            </div>
          </div>
        </div>
      </ReviewSection>

      {/* ── Error ── */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            background: 'rgba(239,68,68,0.10)',
            border: '1px solid rgba(239,68,68,0.30)',
            borderRadius: 12,
            fontSize: 13,
            color: '#ef4444',
            fontFamily: 'var(--font-body)',
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          onClick={onEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 24px',
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            fontSize: 14,
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
          <Edit2 size={15} strokeWidth={2} />
          Edit
        </button>

        <button
          onClick={handleStartGeneration}
          disabled={isSubmitting}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '14px 32px',
            background: isSubmitting ? 'rgba(168,85,247,0.25)' : 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.8 : 1,
            transition: 'all 0.15s',
            boxShadow: !isSubmitting ? '0 6px 28px rgba(168,85,247,0.40)' : 'none',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => {
            if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
          }}
          onMouseLeave={e => {
            if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Zap size={18} strokeWidth={2.5} />
          )}
          {isSubmitting ? 'Starting generation…' : 'Start Generation'}
        </button>
      </div>
    </div>
  );
}
