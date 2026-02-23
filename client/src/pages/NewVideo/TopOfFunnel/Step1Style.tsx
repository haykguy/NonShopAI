import { useEffect, useState } from 'react';
import { Loader2, ChevronRight } from 'lucide-react';
import type { VideoStyle } from './index';

const MOCK_STYLES: VideoStyle[] = [
  {
    id: 'street-interview',
    name: 'Street Interview',
    description: 'Candid street-style interviews. Real people, real reactions.',
    default_clip_count: 6,
    category: 'top-of-funnel',
  },
  {
    id: 'podium-stage',
    name: 'Podium Stage',
    description: 'Confident on-stage presentations. Authority and expertise.',
    default_clip_count: 7,
    category: 'top-of-funnel',
  },
  {
    id: 'transformation',
    name: 'Transformation',
    description: 'Before-and-after journey. Emotional arc from struggle to solution.',
    default_clip_count: 8,
    category: 'top-of-funnel',
  },
  {
    id: 'holistic-healer',
    name: 'Holistic Healer',
    description: 'Calm, nurturing tone. Natural settings, trust-building content.',
    default_clip_count: 6,
    category: 'top-of-funnel',
  },
];

interface Props {
  selected: VideoStyle | null;
  onSelect: (style: VideoStyle) => void;
  onContinue: () => void;
}

export function Step1Style({ selected, onSelect, onContinue }: Props) {
  const [styles, setStyles] = useState<VideoStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/video-styles?category=top-of-funnel')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.styles || d.data || []);
        setStyles(list.length > 0 ? list : MOCK_STYLES);
      })
      .catch(() => setStyles(MOCK_STYLES))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '48px 0' }}>
        <Loader2 size={18} className="animate-spin" />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading styles…</span>
      </div>
    );
  }

  const displayStyles = styles.length > 0 ? styles : MOCK_STYLES;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
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
          Choose a Style
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          This sets the visual tone and structure of your video.
        </p>
      </div>

      {/* 2×2 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        {displayStyles.map(style => {
          const isSelected = selected?.id === style.id;
          const isHovered = hoveredId === style.id;
          const active = isSelected || isHovered;

          return (
            <button
              key={style.id}
              onClick={() => onSelect(style)}
              onMouseEnter={() => setHoveredId(style.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                background: isSelected
                  ? 'rgba(168,85,247,0.10)'
                  : active
                  ? 'rgba(255,255,255,0.03)'
                  : 'var(--card)',
                border: `1px solid ${isSelected ? '#a855f7' : active ? 'rgba(168,85,247,0.30)' : 'var(--border)'}`,
                borderRadius: 16,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: active && !isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(168,85,247,0.30), 0 8px 32px rgba(168,85,247,0.12)'
                  : 'none',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              {/* Image or placeholder */}
              <div
                style={{
                  width: '100%',
                  height: 160,
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.06) 100%)',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {style.example_image_path ? (
                  <img
                    src={style.example_image_path}
                    alt={style.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  /* Faded style name as placeholder */
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(18px, 3vw, 28px)',
                      fontWeight: 800,
                      color: isSelected ? 'rgba(168,85,247,0.25)' : 'rgba(255,255,255,0.07)',
                      letterSpacing: '-0.02em',
                      userSelect: 'none',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      padding: '0 16px',
                      lineHeight: 1.2,
                      transition: 'color 0.2s',
                    }}
                  >
                    {style.name}
                  </div>
                )}

                {/* Selected checkmark badge */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(168,85,247,0.5)',
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 14, lineHeight: 1 }}>✓</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '18px 20px' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 6,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {style.name}
                </div>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    lineHeight: 1.6,
                    marginBottom: 14,
                  }}
                >
                  {style.description}
                </p>
                {style.default_clip_count && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 10.5,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      background: isSelected ? 'rgba(168,85,247,0.18)' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#a855f7' : 'var(--text-muted)',
                      border: `1px solid ${isSelected ? 'rgba(168,85,247,0.35)' : 'var(--border)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {style.default_clip_count} clips default
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue button */}
      {selected && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease',
          }}
        >
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
            Continue with {selected.name}
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
