import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';

interface Props {
  title: string;
  emoji: string;
  description: string;
  features: string[];
  accentColor: string;
  accentDim: string;
  accentBorder: string;
}

export function PlaceholderPage({ title, emoji, description, features, accentColor, accentDim, accentBorder }: Props) {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Back button */}
        <div className="animate-fade-up" style={{ marginBottom: 40 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              padding: '4px 0',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
            onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            Go back
          </button>
        </div>

        {/* Hero card */}
        <div
          className="animate-fade-up delay-1"
          style={{
            background: accentDim,
            border: `1px solid ${accentBorder}`,
            borderRadius: 24,
            padding: '48px 44px',
            textAlign: 'center',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '80%',
              background: `radial-gradient(ellipse, ${accentColor}18 0%, transparent 70%)`,
              pointerEvents: 'none',
            }}
          />

          {/* Coming Soon badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 14px',
              background: `${accentColor}14`,
              border: `1px solid ${accentBorder}`,
              borderRadius: 20,
              marginBottom: 28,
              position: 'relative',
            }}
          >
            <Clock size={11} color={accentColor} strokeWidth={2.5} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: accentColor,
              }}
            >
              Coming Soon
            </span>
          </div>

          {/* Emoji */}
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 24, position: 'relative' }}>
            {emoji}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 36,
              fontWeight: 800,
              color: 'var(--text)',
              letterSpacing: '-0.03em',
              marginBottom: 16,
              position: 'relative',
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: 15,
              lineHeight: 1.7,
              maxWidth: 400,
              margin: '0 auto 36px',
              position: 'relative',
            }}
          >
            {description}
          </p>

          {/* Feature list */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              textAlign: 'left',
              marginBottom: 36,
              position: 'relative',
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'rgba(0,0,0,0.2)',
                  border: `1px solid ${accentBorder}`,
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: accentColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                  }}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>

          {/* Notify CTA */}
          <p style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', position: 'relative' }}>
            This studio mode is under development — check back soon.
          </p>
        </div>

        {/* Alternative CTA */}
        <div
          className="animate-fade-up delay-2"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: 4,
              }}
            >
              Try Pixar AI in the meantime
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Our flagship studio mode is ready to use right now.
            </p>
          </div>
          <button onClick={() => navigate('/pixar-ai')} className="btn-gold">
            <Sparkles size={14} />
            Launch Pixar AI
          </button>
        </div>

      </div>
    </div>
  );
}
