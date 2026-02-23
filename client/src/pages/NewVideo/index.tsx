import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Sparkles, Mic2, SlidersHorizontal, ArrowRight } from 'lucide-react';

const cards = [
  {
    id: 'pixar-ai',
    icon: Sparkles,
    iconColor: '#f5a623',
    iconBg: 'rgba(245,166,35,0.15)',
    title: 'Pixar AI',
    description:
      'Animated characters tell the story. Villain represents the problem, hero is the supplement.',
    tag: 'Veo 3 + Nano Banana Pro',
    tagColor: 'rgba(245,166,35,0.18)',
    tagText: '#f5a623',
    tagBorder: 'rgba(245,166,35,0.35)',
    gradient: 'linear-gradient(135deg, rgba(245,166,35,0.08) 0%, rgba(168,85,247,0.06) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(168,85,247,0.10) 100%)',
    accentBorder: 'rgba(245,166,35,0.40)',
    glow: 'rgba(245,166,35,0.14)',
    path: '/pixar-ai',
  },
  {
    id: 'top-of-funnel',
    icon: Mic2,
    iconColor: '#a855f7',
    iconBg: 'rgba(168,85,247,0.15)',
    title: 'Top of Funnel',
    description:
      'Photorealistic talking-head videos. Street interviews, stage presentations, transformations.',
    tag: 'Veo 3 · Optional HeyGen + 11Labs',
    tagColor: 'rgba(168,85,247,0.18)',
    tagText: '#a855f7',
    tagBorder: 'rgba(168,85,247,0.35)',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(236,72,153,0.06) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(236,72,153,0.10) 100%)',
    accentBorder: 'rgba(168,85,247,0.40)',
    glow: 'rgba(168,85,247,0.14)',
    path: '/new-video/top-of-funnel',
  },
  {
    id: 'custom',
    icon: SlidersHorizontal,
    iconColor: '#14b8a6',
    iconBg: 'rgba(20,184,166,0.15)',
    title: 'Custom',
    description:
      'Full manual control. Write your own prompts, add any clips, no template restrictions.',
    tag: 'All tools available',
    tagColor: 'rgba(20,184,166,0.18)',
    tagText: '#14b8a6',
    tagBorder: 'rgba(20,184,166,0.35)',
    gradient: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.06) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(20,184,166,0.15) 0%, rgba(59,130,246,0.10) 100%)',
    accentBorder: 'rgba(20,184,166,0.40)',
    glow: 'rgba(20,184,166,0.14)',
    path: '/new-video/custom',
  },
];

export function NewVideoPage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 52 }}>
        <div
          className="accent-pill"
          style={{ marginBottom: 16 }}
        >
          <Sparkles size={10} color="currentColor" />
          New Video
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.06,
            letterSpacing: '-0.02em',
            color: 'var(--text)',
            marginBottom: 12,
          }}
        >
          Create New Video
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.6, maxWidth: 480 }}>
          What type of content are you making today?
        </p>
      </div>

      {/* Card grid */}
      <div
        className="animate-fade-up delay-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }}
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          const isHovered = hovered === card.id;
          return (
            <button
              key={card.id}
              onClick={() => navigate(card.path)}
              onMouseEnter={() => setHovered(card.id)}
              onMouseLeave={() => setHovered(null)}
              className={`animate-fade-up delay-${i + 1}`}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                background: isHovered ? card.gradientHover : card.gradient,
                border: `1px solid ${isHovered ? card.accentBorder : 'var(--border)'}`,
                borderRadius: 20,
                padding: '36px 32px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                transform: isHovered ? 'translateY(-4px)' : 'none',
                boxShadow: isHovered ? `0 20px 60px ${card.glow}` : 'none',
                textAlign: 'left',
                height: '100%',
                minHeight: 300,
              }}
            >
              {/* Background glow blob */}
              <div style={{
                position: 'absolute',
                top: -48,
                right: -48,
                width: 160,
                height: 160,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${card.iconColor}22 0%, transparent 70%)`,
                transition: 'opacity 0.3s',
                opacity: isHovered ? 1 : 0.5,
                pointerEvents: 'none',
              }} />

              {/* Icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: card.iconBg,
                  border: `1px solid ${card.accentBorder}`,
                  borderRadius: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  flexShrink: 0,
                  transition: 'transform 0.2s',
                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <Icon size={24} color={card.iconColor} strokeWidth={1.8} />
              </div>

              {/* Title */}
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: 10,
                  letterSpacing: '-0.01em',
                }}
              >
                {card.title}
              </div>

              {/* Description */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: 14,
                  lineHeight: 1.7,
                  flex: 1,
                  marginBottom: 24,
                }}
              >
                {card.description}
              </p>

              {/* Tag pill */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.03em',
                    background: card.tagColor,
                    color: card.tagText,
                    border: `1px solid ${card.tagBorder}`,
                  }}
                >
                  {card.tag}
                </div>
                <ArrowRight
                  size={16}
                  color={card.iconColor}
                  style={{
                    transition: 'transform 0.18s',
                    transform: isHovered ? 'translateX(5px)' : 'none',
                    opacity: isHovered ? 1 : 0.5,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
