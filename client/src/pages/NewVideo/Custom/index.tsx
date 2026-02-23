import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, GripVertical, Sparkles, X, Loader2,
  ChevronRight, Zap,
} from 'lucide-react';

// ── Auto-resize textarea ───────────────────────────────────────────────────────

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  onFocus,
  onBlur,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{ resize: 'none', overflow: 'hidden', ...style }}
    />
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface CustomClip {
  id: string;
  imagePrompt: string;
  videoPrompt: string;
  voiceLine: string;
}

interface Product {
  id: string;
  name: string;
}

// ── Helper ────────────────────────────────────────────────────────────────────

let idCtr = 0;
function makeId() {
  return `clip-${Date.now()}-${++idCtr}`;
}

function makeClip(): CustomClip {
  return { id: makeId(), imagePrompt: '', videoPrompt: '', voiceLine: '' };
}

// ── Clip Card ─────────────────────────────────────────────────────────────────

interface ClipCardProps {
  clip: CustomClip;
  index: number;
  total: number;
  onUpdate: (id: string, field: keyof CustomClip, value: string) => void;
  onAddAfter: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.MouseEvent | React.TouchEvent, id: string) => void;
  dragOverId: string | null;
  onDragOver: (id: string) => void;
}

function ClipCard({
  clip, index, total, onUpdate, onAddAfter, onDelete, onDragStart, dragOverId, onDragOver,
}: ClipCardProps) {
  const isDragOver = dragOverId === clip.id;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${isDragOver ? '#a855f7' : 'var(--border)'}`,
        borderRadius: 16,
        marginBottom: 12,
        transition: 'border-color 0.15s, transform 0.15s',
        transform: isDragOver ? 'scale(1.005)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={() => onDragOver(clip.id)}
      onMouseLeave={() => onDragOver('')}
    >
      {/* Top stripe */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: isDragOver
            ? 'linear-gradient(90deg, #a855f7, #ec4899)'
            : 'transparent',
          transition: 'background 0.15s',
        }}
      />

      <div style={{ display: 'flex', gap: 0 }}>
        {/* Drag handle */}
        <div
          onMouseDown={e => onDragStart(e, clip.id)}
          onTouchStart={e => onDragStart(e, clip.id)}
          style={{
            width: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'grab',
            color: 'var(--text-dim)',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            userSelect: 'none',
          }}
          title="Drag to reorder"
        >
          <GripVertical size={16} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1, padding: '16px 18px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.20), rgba(236,72,153,0.12))',
                border: '1px solid rgba(168,85,247,0.25)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: '#a855f7',
              }}
            >
              {index + 1}
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Add clip after this one */}
              <button
                onClick={() => onAddAfter(clip.id)}
                title="Add clip after this"
                style={{
                  all: 'unset',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = '#a855f7';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(168,85,247,0.4)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <Plus size={13} strokeWidth={2.5} />
              </button>
              {/* Delete clip */}
              <button
                onClick={() => onDelete(clip.id)}
                title="Delete clip"
                disabled={total <= 1}
                style={{
                  all: 'unset',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  cursor: total <= 1 ? 'not-allowed' : 'pointer',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                  transition: 'all 0.15s',
                  opacity: total <= 1 ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (total <= 1) return;
                  (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* Two-column prompt fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                Image Prompt
              </label>
              <AutoResizeTextarea
                value={clip.imagePrompt}
                onChange={v => onUpdate(clip.id, 'imagePrompt', v)}
                placeholder="Describe the visual frame…"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.22)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  padding: '9px 11px',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  lineHeight: 1.65,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.45)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
                Video Prompt
              </label>
              <AutoResizeTextarea
                value={clip.videoPrompt}
                onChange={v => onUpdate(clip.id, 'videoPrompt', v)}
                placeholder="Describe the motion and camera…"
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.22)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  padding: '9px 11px',
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  lineHeight: 1.65,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.45)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>
          </div>

          {/* Voice line */}
          <div>
            <label style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>
              Voice Line <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-dim)', fontSize: 10 }}>(optional)</span>
            </label>
            <input
              value={clip.voiceLine}
              onChange={e => onUpdate(clip.id, 'voiceLine', e.target.value)}
              placeholder="What the narrator or presenter says…"
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.18)',
                border: '1px solid var(--border)',
                borderRadius: 9,
                padding: '8px 11px',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
                fontSize: 12.5,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.45)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AI Assist Sidebar ─────────────────────────────────────────────────────────

interface AiSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedProduct: Product | null;
  onApply: (clips: CustomClip[]) => void;
}

function AiAssistSidebar({ open, onClose, selectedProduct, onApply }: AiSidebarProps) {
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewClips, setPreviewClips] = useState<CustomClip[]>([]);

  async function handleGenerate() {
    if (!aiDescription.trim()) return;
    setIsGenerating(true);
    setPreviewClips([]);

    try {
      const res = await fetch('/api/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          style: 'custom',
          freeformDescription: aiDescription,
          product: selectedProduct?.name,
        }),
      });
      const data = await res.json();
      const clips: CustomClip[] = (data.clips || []).map((c: any) => ({
        id: makeId(),
        imagePrompt: c.image_prompt || '',
        videoPrompt: c.video_prompt || '',
        voiceLine: c.voice_line || '',
      }));
      setPreviewClips(clips.length > 0 ? clips : generateMockClips(aiDescription));
    } catch {
      setPreviewClips(generateMockClips(aiDescription));
    } finally {
      setIsGenerating(false);
    }
  }

  function generateMockClips(desc: string): CustomClip[] {
    return Array.from({ length: 6 }, (_, i) => ({
      id: makeId(),
      imagePrompt: `Clip ${i + 1}: ${desc.slice(0, 50)}… photorealistic, cinematic.`,
      videoPrompt: `Camera slowly pushes in. ${i === 0 ? 'Dramatic hook.' : i === 5 ? 'Strong CTA close.' : 'Natural movement.'}`,
      voiceLine: '',
    }));
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            zIndex: 1100,
          }}
        />
      )}

      {/* Sidebar panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 400,
          background: 'rgba(18,18,26,0.98)',
          backdropFilter: 'blur(24px)',
          borderLeft: '1px solid var(--border)',
          zIndex: 1200,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 56,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(236,72,153,0.15))',
                border: '1px solid rgba(168,85,247,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={16} color="#a855f7" strokeWidth={2} />
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
              AI Assist
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              all: 'unset',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {selectedProduct && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.20)',
                borderRadius: 10,
                fontSize: 12,
                color: '#a855f7',
                fontFamily: 'var(--font-body)',
                marginBottom: 18,
              }}
            >
              Product context: <strong>{selectedProduct.name}</strong>
            </div>
          )}

          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Describe what you want
          </label>
          <textarea
            value={aiDescription}
            onChange={e => setAiDescription(e.target.value)}
            rows={6}
            placeholder="e.g. 6 clips about joint pain for an older woman on a stage, build fear then reveal Ca-AKG as solution, be aggressive"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.30)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
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
            onClick={handleGenerate}
            disabled={isGenerating || !aiDescription.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 22px',
              width: '100%',
              justifyContent: 'center',
              background: isGenerating || !aiDescription.trim()
                ? 'rgba(168,85,247,0.15)'
                : 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 13.5,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: isGenerating || !aiDescription.trim() ? 'not-allowed' : 'pointer',
              opacity: isGenerating || !aiDescription.trim() ? 0.6 : 1,
              transition: 'all 0.15s',
              boxShadow: !isGenerating && aiDescription.trim() ? '0 4px 18px rgba(168,85,247,0.35)' : 'none',
              marginBottom: 24,
            }}
          >
            {isGenerating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} strokeWidth={2} />}
            {isGenerating ? 'Generating Prompts…' : 'Generate Prompts'}
          </button>

          {/* Preview clips */}
          {previewClips.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                Preview ({previewClips.length} clips)
              </div>
              {previewClips.map((clip, i) => (
                <div
                  key={clip.id}
                  style={{
                    background: 'rgba(0,0,0,0.20)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#a855f7', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                    CLIP {i + 1}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: 1.6, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>IMG: </span>{clip.imagePrompt.slice(0, 80)}…
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                    <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>VID: </span>{clip.videoPrompt.slice(0, 80)}…
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply footer */}
        {previewClips.length > 0 && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
              background: 'rgba(0,0,0,0.20)',
            }}
          >
            <button
              onClick={() => { onApply(previewClips); onClose(); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(168,85,247,0.35)',
              }}
            >
              Apply to Canvas
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Custom Editor Page ────────────────────────────────────────────────────────

export function CustomVideoPage() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [clips, setClips] = useState<CustomClip[]>([makeClip(), makeClip(), makeClip()]);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16');
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const productsFetched = useRef(false);

  // Fetch products once
  if (!productsFetched.current) {
    productsFetched.current = true;
    fetch('/api/products')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.products || d.data || []);
        setProducts(list);
      })
      .catch(() => {
        setProducts([
          { id: 'ca-akg', name: 'Ca-AKG' },
          { id: 'nmn', name: 'NMN Boost' },
          { id: 'joint', name: 'Joint Relief' },
        ]);
      });
  }

  // ── Clip operations ──────────────────────────────────────────────────────
  const updateClip = useCallback((id: string, field: keyof CustomClip, value: string) => {
    setClips(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }, []);

  const addClipAfter = useCallback((id: string) => {
    setClips(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return [...prev, makeClip()];
      const next = [...prev];
      next.splice(idx + 1, 0, makeClip());
      return next;
    });
  }, []);

  const deleteClip = useCallback((id: string) => {
    setClips(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev);
  }, []);

  // ── Drag reorder (CSS only, no library) ──────────────────────────────────
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent, id: string) => {
    setDragId(id);
    // Simple positional swap on mouseup
    const onUp = () => {
      setDragId(null);
      if (dragOverId && dragOverId !== id) {
        setClips(prev => {
          const fromIdx = prev.findIndex(c => c.id === id);
          const toIdx = prev.findIndex(c => c.id === dragOverId);
          if (fromIdx < 0 || toIdx < 0) return prev;
          const next = [...prev];
          const [item] = next.splice(fromIdx, 1);
          next.splice(toIdx, 0, item);
          return next;
        });
      }
      setDragOverId(null);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
  }, [dragOverId]);

  // ── AI apply ─────────────────────────────────────────────────────────────
  const handleApplyAi = useCallback((generated: CustomClip[]) => {
    setClips(generated);
  }, []);

  // ── Start generation ──────────────────────────────────────────────────────
  async function handleStartGeneration() {
    const filledClips = clips.filter(c => c.imagePrompt.trim() || c.videoPrompt.trim());
    if (filledClips.length === 0) {
      setError('Add at least one clip prompt before generating.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const projectRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName.trim() || 'Custom Video',
          clipCount: filledClips.length,
          settings: {
            aspectRatio,
            autoPickImage: true,
          },
          clips: filledClips.map((c, i) => ({
            index: i,
            imagePrompt: c.imagePrompt,
            videoPrompt: c.videoPrompt,
            status: 'pending',
            retryCount: 0,
          })),
        }),
      });
      const project = await projectRes.json();
      if (!projectRes.ok) throw new Error(project.error || 'Failed to create project');

      if (selectedProduct) {
        await fetch('/api/video-metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: project.id, product_id: selectedProduct.id }),
        }).catch(() => {});
      }

      await fetch(`/api/projects/${project.id}/generate`, { method: 'POST' });
      navigate('/pixar-ai', { state: { projectId: project.id } });
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ── Sticky header bar ── */}
      <div
        style={{
          position: 'sticky',
          top: 'var(--nav-h)',
          zIndex: 900,
          background: 'rgba(5,5,7,0.88)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          borderBottom: '1px solid var(--border)',
          padding: '0 28px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          height: 58,
        }}
      >
        {/* Left — project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', flexShrink: 0 }}>
            Custom Video
          </span>
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          <input
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Untitled project…"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              flex: 1,
              maxWidth: 260,
            }}
          />
        </div>

        {/* Center — product selector */}
        <select
          value={selectedProduct?.id ?? ''}
          onChange={e => {
            const p = products.find(p => p.id === e.target.value) ?? null;
            setSelectedProduct(p);
          }}
          style={{
            padding: '7px 12px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            color: selectedProduct ? 'var(--text)' : 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: 12.5,
            outline: 'none',
            cursor: 'pointer',
            minWidth: 160,
          }}
        >
          <option value="">No product</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Right — aspect ratio, AI assist, generate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Aspect ratio toggle */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {(['9:16', '16:9'] as const).map(r => (
              <button
                key={r}
                onClick={() => setAspectRatio(r)}
                style={{
                  all: 'unset',
                  padding: '6px 12px',
                  fontSize: 11.5,
                  fontWeight: aspectRatio === r ? 600 : 400,
                  fontFamily: 'var(--font-mono)',
                  color: aspectRatio === r ? '#fff' : 'var(--text-muted)',
                  background: aspectRatio === r ? 'rgba(168,85,247,0.22)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>

          {/* AI Assist button */}
          <button
            onClick={() => setAiSidebarOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: 'rgba(168,85,247,0.14)',
              color: '#a855f7',
              border: '1px solid rgba(168,85,247,0.30)',
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.22)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.14)'}
          >
            <Sparkles size={13} strokeWidth={2} />
            AI Assist
          </button>

          {/* Start Generation */}
          <button
            onClick={handleStartGeneration}
            disabled={isSubmitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 16px',
              background: isSubmitting ? 'rgba(168,85,247,0.20)' : 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff',
              border: 'none',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              boxShadow: !isSubmitting ? '0 3px 14px rgba(168,85,247,0.35)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} strokeWidth={2.5} />}
            {isSubmitting ? 'Starting…' : 'Start Generation'}
          </button>
        </div>
      </div>

      {/* ── Main clip canvas ── */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 28px 80px' }}>

        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 10, fontSize: 13, color: '#ef4444', fontFamily: 'var(--font-body)', marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Clip count + aspect ratio info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text)' }}>{clips.length}</span> clips · {aspectRatio} · Custom
          </div>
        </div>

        {/* Clips */}
        <div>
          {clips.map((clip, i) => (
            <ClipCard
              key={clip.id}
              clip={clip}
              index={i}
              total={clips.length}
              onUpdate={updateClip}
              onAddAfter={addClipAfter}
              onDelete={deleteClip}
              onDragStart={handleDragStart}
              dragOverId={dragId ? dragOverId : null}
              onDragOver={id => dragId && setDragOverId(id)}
            />
          ))}
        </div>
      </div>

      {/* AI Assist sidebar */}
      <AiAssistSidebar
        open={aiSidebarOpen}
        onClose={() => setAiSidebarOpen(false)}
        selectedProduct={selectedProduct}
        onApply={handleApplyAi}
      />
    </div>
  );
}
