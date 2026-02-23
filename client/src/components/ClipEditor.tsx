import { useState, useRef, useEffect } from 'react';
import { PencilLine, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

interface ClipData {
  imagePrompt: string;
  videoPrompt: string;
}

interface Props {
  index: number;
  clip: ClipData;
  total: number;
  onChange: (clip: ClipData) => void;
  onAddAfter: () => void;
  onDelete: () => void;
}

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

export function ClipEditor({ index, clip, total, onChange, onAddAfter, onDelete }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--glass-bg)',
      }}
    >
      {/* Collapse header */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'transparent',
        }}
      >
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textAlign: 'left',
          }}
        >
          <PencilLine size={13} color="var(--gold)" strokeWidth={2} />
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 13,
              color: 'var(--text)',
            }}
          >
            Clip {index + 1}
          </span>
          {clip.imagePrompt && (
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 180,
              }}
            >
              — {clip.imagePrompt.substring(0, 40)}{clip.imagePrompt.length > 40 ? '…' : ''}
            </span>
          )}
          {expanded
            ? <ChevronUp size={14} color="var(--text-muted)" strokeWidth={2} style={{ marginLeft: 'auto', flexShrink: 0 }} />
            : <ChevronDown size={14} color="var(--text-muted)" strokeWidth={2} style={{ marginLeft: 'auto', flexShrink: 0 }} />
          }
        </button>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 5, marginLeft: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onAddAfter(); }}
            title="Add clip after this"
            style={{
              all: 'unset',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,166,35,0.4)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--gold-dim)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)';
            }}
          >
            <Plus size={12} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            title="Delete clip"
            disabled={total <= 1}
            style={{
              all: 'unset',
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              cursor: total <= 1 ? 'not-allowed' : 'pointer',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              transition: 'all 0.15s',
              opacity: total <= 1 ? 0.35 : 1,
            }}
            onMouseEnter={e => {
              if (total <= 1) return;
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.35)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--error-dim)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)';
            }}
          >
            <Trash2 size={12} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div
          style={{
            padding: '0 14px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            borderTop: '1px solid var(--separator)',
          }}
        >
          <div style={{ paddingTop: 12 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
                fontFamily: 'var(--font-body)',
              }}
            >
              Image Prompt
            </label>
            <AutoResizeTextarea
              value={clip.imagePrompt}
              onChange={v => onChange({ ...clip, imagePrompt: v })}
              placeholder="Describe the image to generate..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                outline: 'none',
                lineHeight: 1.55,
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
                fontFamily: 'var(--font-body)',
              }}
            >
              Video Prompt
            </label>
            <AutoResizeTextarea
              value={clip.videoPrompt}
              onChange={v => onChange({ ...clip, videoPrompt: v })}
              placeholder="Describe the video motion/action..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--text)',
                outline: 'none',
                lineHeight: 1.55,
                transition: 'border-color 0.15s',
                boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--blue)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
