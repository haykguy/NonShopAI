import { useState } from 'react';
import type { Project } from '../types';
import { Settings, Plus, Minus, Sparkles } from 'lucide-react';

interface Props {
  onCreateProject: (name: string, clipCount: number, settings: any) => Promise<Project>;
  loading: boolean;
}

export function ProjectSetup({ onCreateProject, loading }: Props) {
  const [name, setName] = useState('');
  const [clipCount, setClipCount] = useState(7);
  const [autoPickImage, setAutoPickImage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateProject(name || `Video ${new Date().toLocaleDateString()}`, clipCount, {
      autoPickImage,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px 28px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 30,
              height: 30,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings size={14} color="var(--gold)" strokeWidth={2} />
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
            }}
          >
            New Project
          </h2>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 24, fontFamily: 'var(--font-body)', paddingLeft: 40 }}>
          Layout settings (borders, text, aspect ratio) are configured in the visual mockup on the next screen.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Project Name */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                marginBottom: 6,
                letterSpacing: '0.01em',
              }}
            >
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Video Project"
              className="ns-input"
            />
          </div>

          {/* Clip Count */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                marginBottom: 6,
              }}
            >
              Number of Clips:{' '}
              <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)' }}>{clipCount}</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={() => setClipCount(Math.max(1, clipCount - 1))}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)')}
              >
                <Minus size={14} />
              </button>
              <input
                type="range"
                min={1}
                max={20}
                value={clipCount}
                onChange={e => setClipCount(parseInt(e.target.value))}
                style={{
                  flex: 1,
                  accentColor: 'var(--gold)',
                  cursor: 'pointer',
                }}
              />
              <button
                type="button"
                onClick={() => setClipCount(Math.min(20, clipCount + 1))}
                style={{
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)')}
                onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)')}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Image Selection — full width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                marginBottom: 6,
              }}
            >
              Image Selection
            </label>
            <select
              value={autoPickImage ? 'auto' : 'review'}
              onChange={e => setAutoPickImage(e.target.value === 'auto')}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
                appearance: 'auto',
              }}
            >
              <option value="auto" style={{ background: 'var(--surface)' }}>Auto-pick first image (faster)</option>
              <option value="review" style={{ background: 'var(--surface)' }}>Generate 4 images, let me choose</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-gold"
        style={{ width: '100%', padding: '14px 24px', fontSize: 15, borderRadius: 10, justifyContent: 'center' }}
      >
        <Sparkles size={15} strokeWidth={2.5} />
        {loading ? 'Creating…' : 'Create Project'}
      </button>
    </form>
  );
}
