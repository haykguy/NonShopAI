import { useState } from 'react';
import { PencilLine, ChevronDown, ChevronUp } from 'lucide-react';

interface ClipData {
  imagePrompt: string;
  videoPrompt: string;
}

interface Props {
  index: number;
  clip: ClipData;
  onChange: (clip: ClipData) => void;
}

export function ClipEditor({ index, clip, onChange }: Props) {
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
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg-heavy)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
        </div>
        {expanded
          ? <ChevronUp size={14} color="var(--text-muted)" strokeWidth={2} />
          : <ChevronDown size={14} color="var(--text-muted)" strokeWidth={2} />
        }
      </button>

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
            <textarea
              value={clip.imagePrompt}
              onChange={e => onChange({ ...clip, imagePrompt: e.target.value })}
              rows={3}
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
                resize: 'vertical',
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
            <textarea
              value={clip.videoPrompt}
              onChange={e => onChange({ ...clip, videoPrompt: e.target.value })}
              rows={3}
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
                resize: 'vertical',
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
