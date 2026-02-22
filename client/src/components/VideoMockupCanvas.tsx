import { useRef, useState, useCallback, useEffect } from 'react';
import type { ProjectSettings } from '../types';
import { Upload, X, Monitor, Smartphone, Move, Info } from 'lucide-react';

interface Props {
  settings: ProjectSettings;
  onChange: (patch: Partial<ProjectSettings>) => void;
}

const DEBOUNCE_MS = 300;

function useDebounced<T>(fn: (val: T) => void, ms: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (val: T) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(val), ms);
    },
    [fn, ms]
  );
}

type DragMode =
  | null
  | 'image'
  | 'text'
  | 'border-top'
  | 'border-bottom'
  | 'border-left'
  | 'border-right';

export function VideoMockupCanvas({ settings, onChange }: Props) {
  const [local, setLocal] = useState<ProjectSettings>({
    ...settings,
    titleXPercent: settings.titleXPercent ?? 50,
    imageXPercent: settings.imageXPercent ?? 50,
    imageYPercent: settings.imageYPercent ?? 50,
    imageScale: settings.imageScale ?? 1,
  });
  const [sampleImage, setSampleImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [hint, setHint] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, valX: 0, valY: 0, border: 0, scale: 1 });

  // Keep local in sync when parent pushes a fresh project load
  useEffect(() => {
    setLocal(prev => ({
      ...prev,
      ...settings,
      titleXPercent: settings.titleXPercent ?? prev.titleXPercent ?? 50,
      imageXPercent: settings.imageXPercent ?? prev.imageXPercent ?? 50,
      imageYPercent: settings.imageYPercent ?? prev.imageYPercent ?? 50,
      imageScale: settings.imageScale ?? prev.imageScale ?? 1,
    }));
  }, [
    settings.aspectRatio, settings.borderWidthPercent, settings.titleText,
    settings.titleYPercent, settings.titleXPercent, settings.titleFontSize,
    settings.titleColor, settings.titleBoxOpacity,
  ]);

  const saveDebounced = useDebounced(onChange, DEBOUNCE_MS);

  function update(patch: Partial<ProjectSettings>) {
    const next = { ...local, ...patch };
    setLocal(next);
    saveDebounced(patch);
  }

  const is16x9 = local.aspectRatio === '16:9';
  const [canvasDisplayW, setCanvasDisplayW] = useState(320);

  useEffect(() => {
    if (!canvasRef.current) return;
    const obs = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect;
      if (r) setCanvasDisplayW(r.width);
    });
    obs.observe(canvasRef.current);
    return () => obs.disconnect();
  }, []);

  // Scale font proportionally
  const realOutW = is16x9 ? 1920 : 1080;
  const fontScale = canvasDisplayW / realOutW;
  const displayFontSize = Math.max(8, Math.round(local.titleFontSize * fontScale));

  // --- Image file drop / click ---
  function handleImageDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => setSampleImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  function handleImageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setSampleImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  }

  // ── Generic pointer-drag system ──────────────────────────────────────────

  function getCanvasRect() {
    return canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0, width: 1, height: 1 };
  }

  function startDrag(
    e: React.PointerEvent,
    mode: DragMode,
    extraInit: Partial<typeof dragStart.current> = {}
  ) {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      valX: local.titleXPercent ?? 50,
      valY: local.titleYPercent,
      border: local.borderWidthPercent,
      scale: local.imageScale ?? 1,
      ...extraInit,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragMode) return;
    const rect = getCanvasRect();
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    const dxPct = (dx / rect.width) * 100;
    const dyPct = (dy / rect.height) * 100;

    if (dragMode === 'text') {
      const newX = Math.max(5, Math.min(95, dragStart.current.valX + dxPct));
      const newY = Math.max(2, Math.min(97, dragStart.current.valY + dyPct));
      setLocal(prev => ({ ...prev, titleXPercent: newX, titleYPercent: newY }));
    } else if (dragMode === 'image') {
      const newX = Math.max(0, Math.min(100, dragStart.current.valX + dxPct));
      const newY = Math.max(0, Math.min(100, dragStart.current.valY + dyPct));
      setLocal(prev => ({ ...prev, imageXPercent: newX, imageYPercent: newY }));
    } else if (dragMode === 'border-top' || dragMode === 'border-bottom') {
      const delta = dragMode === 'border-top' ? -dyPct : dyPct;
      const newBorder = Math.max(0, Math.min(15, dragStart.current.border + delta));
      setLocal(prev => ({ ...prev, borderWidthPercent: Math.round(newBorder) }));
    } else if (dragMode === 'border-left' || dragMode === 'border-right') {
      const delta = dragMode === 'border-left' ? -dxPct : dxPct;
      const newBorder = Math.max(0, Math.min(15, dragStart.current.border + delta));
      setLocal(prev => ({ ...prev, borderWidthPercent: Math.round(newBorder) }));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragMode) return;
    // Commit the final value
    onPointerMove(e); // apply one last delta
    setDragMode(null);

    // Read the latest local state via a function so we get the post-move value
    setLocal(prev => {
      const patch: Partial<ProjectSettings> = {};
      if (dragMode === 'text') {
        patch.titleXPercent = prev.titleXPercent;
        patch.titleYPercent = prev.titleYPercent;
      } else if (dragMode === 'image') {
        patch.imageXPercent = prev.imageXPercent;
        patch.imageYPercent = prev.imageYPercent;
      } else {
        patch.borderWidthPercent = prev.borderWidthPercent;
      }
      saveDebounced(patch);
      return prev;
    });
  }

  // Wheel to zoom image
  function onWheel(e: React.WheelEvent) {
    if (!sampleImage) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    const newScale = Math.max(0.3, Math.min(3, (local.imageScale ?? 1) + delta));
    update({ imageScale: newScale });
  }

  const bp = local.borderWidthPercent;
  const EDGE_HIT = 12; // px hit area for border drag handles

  const cursorForMode: Record<string, string> = {
    image: 'grabbing',
    text: 'grabbing',
    'border-top': 'ns-resize',
    'border-bottom': 'ns-resize',
    'border-left': 'ew-resize',
    'border-right': 'ew-resize',
  };

  const canvasCursor = dragMode ? cursorForMode[dragMode] : 'default';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Format toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Format
        </span>
        <div
          style={{
            display: 'flex',
            borderRadius: 10,
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {[
            { ratio: '9:16' as const, icon: <Smartphone size={13} />, label: '9:16' },
            { ratio: '16:9' as const, icon: <Monitor size={13} />, label: '16:9' },
          ].map(({ ratio, icon, label }) => {
            const active = local.aspectRatio === ratio;
            return (
              <button
                key={ratio}
                type="button"
                onClick={() => update({ aspectRatio: ratio })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  fontWeight: active ? 600 : 400,
                  background: active ? 'var(--purple-dim)' : 'transparent',
                  color: active ? 'var(--purple)' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {icon}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: is16x9 ? '16/9' : '9/16',
          background: '#000',
          borderRadius: 10,
          border: `2px solid ${dragMode ? 'var(--border-bright)' : 'var(--border)'}`,
          overflow: 'hidden',
          userSelect: 'none',
          cursor: canvasCursor,
          transition: 'border-color 0.2s',
        }}
        onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleImageDrop}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onWheel={onWheel}
      >
        {/* ── Black border inset ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            padding: `${bp}%`,
          }}
        >
          {/* Inner video area */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            {sampleImage ? (
              <img
                src={sampleImage}
                alt="Sample"
                draggable={false}
                onPointerDown={e => startDrag(e, 'image', {
                  valX: local.imageXPercent ?? 50,
                  valY: local.imageYPercent ?? 50,
                })}
                style={{
                  position: 'absolute',
                  width: `${(local.imageScale ?? 1) * 100}%`,
                  height: `${(local.imageScale ?? 1) * 100}%`,
                  objectFit: 'cover',
                  left: `${(local.imageXPercent ?? 50) - (local.imageScale ?? 1) * 50}%`,
                  top: `${(local.imageYPercent ?? 50) - (local.imageScale ?? 1) * 50}%`,
                  cursor: dragMode === 'image' ? 'grabbing' : 'grab',
                  transform: 'translateZ(0)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundImage: 'repeating-conic-gradient(#c0c0c0 0% 25%, #e8e8e8 0% 50%)',
                  backgroundSize: '20px 20px',
                }}
              >
                {isDragOver ? (
                  <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 8, padding: '6px 14px', fontSize: 11, color: '#333', fontFamily: 'var(--font-body)', fontWeight: 600 }}>
                    Drop image here
                  </div>
                ) : (
                  <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, color: '#888' }}>
                    <Upload size={18} />
                    <span style={{ fontSize: 10, fontWeight: 500, textAlign: 'center', lineHeight: 1.3, fontFamily: 'var(--font-body)' }}>
                      Drop or click<br />to add sample image
                    </span>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageInputChange} />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Draggable border handles ── */}
        {/* Top */}
        <div
          onPointerDown={e => startDrag(e, 'border-top', { border: local.borderWidthPercent })}
          onMouseEnter={() => setHint('Drag to adjust border')}
          onMouseLeave={() => setHint(null)}
          style={{
            position: 'absolute',
            left: `${EDGE_HIT}px`,
            right: `${EDGE_HIT}px`,
            top: 0,
            height: `${EDGE_HIT}px`,
            cursor: 'ns-resize',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {bp > 1 && (
            <div style={{ width: 30, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
          )}
        </div>
        {/* Bottom */}
        <div
          onPointerDown={e => startDrag(e, 'border-bottom', { border: local.borderWidthPercent })}
          onMouseEnter={() => setHint('Drag to adjust border')}
          onMouseLeave={() => setHint(null)}
          style={{
            position: 'absolute',
            left: `${EDGE_HIT}px`,
            right: `${EDGE_HIT}px`,
            bottom: 0,
            height: `${EDGE_HIT}px`,
            cursor: 'ns-resize',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {bp > 1 && (
            <div style={{ width: 30, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }} />
          )}
        </div>
        {/* Left */}
        <div
          onPointerDown={e => startDrag(e, 'border-left', { border: local.borderWidthPercent })}
          onMouseEnter={() => setHint('Drag to adjust border')}
          onMouseLeave={() => setHint(null)}
          style={{
            position: 'absolute',
            top: `${EDGE_HIT}px`,
            bottom: `${EDGE_HIT}px`,
            left: 0,
            width: `${EDGE_HIT}px`,
            cursor: 'ew-resize',
            zIndex: 10,
          }}
        />
        {/* Right */}
        <div
          onPointerDown={e => startDrag(e, 'border-right', { border: local.borderWidthPercent })}
          onMouseEnter={() => setHint('Drag to adjust border')}
          onMouseLeave={() => setHint(null)}
          style={{
            position: 'absolute',
            top: `${EDGE_HIT}px`,
            bottom: `${EDGE_HIT}px`,
            right: 0,
            width: `${EDGE_HIT}px`,
            cursor: 'ew-resize',
            zIndex: 10,
          }}
        />

        {/* ── Draggable text overlay ── */}
        {local.titleText && (
          <div
            style={{
              position: 'absolute',
              left: `${local.titleXPercent ?? 50}%`,
              top: `${local.titleYPercent}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              cursor: dragMode === 'text' ? 'grabbing' : 'grab',
            }}
            onPointerDown={e => startDrag(e, 'text', {
              valX: local.titleXPercent ?? 50,
              valY: local.titleYPercent,
            })}
          >
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                whiteSpace: 'nowrap',
                maxWidth: `${canvasDisplayW * 0.85}px`,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
                background: `rgba(0,0,0,${local.titleBoxOpacity})`,
                color: local.titleColor,
                fontSize: `${displayFontSize}px`,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                lineHeight: 1.3,
                border: dragMode === 'text' ? '1px dashed rgba(255,255,255,0.5)' : '1px dashed rgba(255,255,255,0)',
                transition: 'border-color 0.15s',
              }}
            >
              {local.titleText}
            </div>
            {/* Drag indicator */}
            {dragMode !== 'text' && (
              <div
                style={{
                  position: 'absolute',
                  top: -18,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 4,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  opacity: 0.7,
                }}
              >
                <Move size={8} style={{ display: 'inline', marginRight: 3 }} />
                drag
              </div>
            )}
          </div>
        )}

        {/* ── Clear image button ── */}
        {sampleImage && (
          <button
            type="button"
            onClick={() => setSampleImage(null)}
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 20,
              height: 20,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              zIndex: 30,
            }}
          >
            <X size={10} />
          </button>
        )}

        {/* ── Active drag mode label ── */}
        {dragMode && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 20,
              pointerEvents: 'none',
              zIndex: 40,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)',
            }}
          >
            {dragMode === 'text' && `Text: ${Math.round(local.titleXPercent ?? 50)}% × ${Math.round(local.titleYPercent)}%`}
            {dragMode === 'image' && `Image: ${Math.round(local.imageXPercent ?? 50)}% × ${Math.round(local.imageYPercent ?? 50)}%`}
            {dragMode?.startsWith('border') && `Border: ${local.borderWidthPercent}%`}
          </div>
        )}

        {/* ── Hint tooltip ── */}
        {hint && !dragMode && (
          <div
            style={{
              position: 'absolute',
              bottom: 8,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: 10,
              padding: '3px 10px',
              borderRadius: 20,
              pointerEvents: 'none',
              zIndex: 40,
              whiteSpace: 'nowrap',
              fontFamily: 'var(--font-body)',
            }}
          >
            {hint}
          </div>
        )}
      </div>

      {/* ── Border value display ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div
            style={{
              width: 8, height: 8,
              background: '#000',
              border: '1px solid var(--border-bright)',
              borderRadius: 2,
            }}
          />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
            Black border
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            onClick={() => update({ borderWidthPercent: Math.max(0, local.borderWidthPercent - 1) })}
            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--glass-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >−</button>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', minWidth: 32, textAlign: 'center' }}>
            {local.borderWidthPercent}%
          </span>
          <button
            type="button"
            onClick={() => update({ borderWidthPercent: Math.min(15, local.borderWidthPercent + 1) })}
            style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--glass-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >+</button>
        </div>
      </div>

      {/* ── Text / overlay controls ── */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>
          Text Overlay
        </div>

        {/* Title text input */}
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'var(--font-body)' }}>
            Text content
          </label>
          <input
            type="text"
            value={local.titleText}
            onChange={e => update({ titleText: e.target.value })}
            placeholder="Your brand name or call to action"
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              color: 'var(--text)',
              outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Font size + color */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'var(--font-body)' }}>
              Font size (px)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => update({ titleFontSize: Math.max(12, local.titleFontSize - 2) })}
                style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--glass-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                −
              </button>
              <input
                type="number"
                min={12} max={200} step={2}
                value={local.titleFontSize}
                onChange={e => update({ titleFontSize: parseInt(e.target.value) || 40 })}
                style={{
                  flex: 1, width: 0,
                  padding: '5px 6px',
                  textAlign: 'center',
                  fontSize: 12,
                  fontFamily: 'var(--font-body)',
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text)',
                  outline: 'none',
                }}
              />
              <button type="button" onClick={() => update({ titleFontSize: Math.min(200, local.titleFontSize + 2) })}
                style={{ width: 24, height: 24, borderRadius: 5, border: '1px solid var(--border)', background: 'var(--glass-bg)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                +
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 5, fontFamily: 'var(--font-body)' }}>
              Text color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={local.titleColor}
                onChange={e => update({ titleColor: e.target.value })}
                style={{
                  width: 36, height: 30,
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  padding: 2,
                  background: 'var(--glass-bg)',
                }}
              />
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {local.titleColor}
              </span>
            </div>
          </div>
        </div>

        {/* Box opacity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Background opacity
            </label>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              {Math.round(local.titleBoxOpacity * 100)}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[0, 0.25, 0.5, 0.75, 1].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => update({ titleBoxOpacity: v })}
                style={{
                  flex: 1,
                  padding: '5px 0',
                  borderRadius: 6,
                  border: `1px solid ${Math.abs(local.titleBoxOpacity - v) < 0.1 ? 'var(--border-bright)' : 'var(--border)'}`,
                  background: Math.abs(local.titleBoxOpacity - v) < 0.1
                    ? 'var(--glass-bg-heavy)'
                    : 'var(--glass-bg)',
                  color: Math.abs(local.titleBoxOpacity - v) < 0.1 ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 10,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {Math.round(v * 100)}%
              </button>
            ))}
          </div>
        </div>

        {local.titleText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'var(--gold-dim)', borderRadius: 6, border: '1px solid rgba(245,166,35,0.15)' }}>
            <Info size={11} color="var(--gold)" />
            <span style={{ fontSize: 11, color: 'var(--gold)', fontFamily: 'var(--font-body)' }}>
              Drag text in the preview to reposition
            </span>
          </div>
        )}
      </div>

      {sampleImage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'var(--glass-bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
          <Info size={11} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Drag image to reposition · Scroll to zoom
          </span>
        </div>
      )}
    </div>
  );
}
