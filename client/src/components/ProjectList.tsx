import { useEffect, useState } from 'react';
import { FolderOpen, Trash2, Clock, CheckCircle2, Loader2, AlertCircle, Film } from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  clipCount: number;
  completedClips: number;
}

interface Props {
  currentProjectId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => Promise<ProjectSummary[]>;
}

const statusConfig: Record<string, { icon: typeof Clock; dotColor: string; label: string; textColor: string }> = {
  draft:      { icon: Clock,        dotColor: 'var(--text-dim)',    textColor: 'var(--text-muted)',    label: 'Draft' },
  generating: { icon: Loader2,      dotColor: 'var(--gold)',        textColor: 'var(--gold)',          label: 'Generating' },
  compiling:  { icon: Loader2,      dotColor: 'var(--blue)',        textColor: 'var(--blue)',          label: 'Compiling' },
  completed:  { icon: CheckCircle2, dotColor: 'var(--success)',     textColor: 'var(--success)',       label: 'Done' },
  error:      { icon: AlertCircle,  dotColor: 'var(--error)',       textColor: 'var(--error)',         label: 'Error' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ProjectList({ currentProjectId, onSelect, onDelete, onRefresh }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const list = await onRefresh();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    await onDelete(id);
    refresh();
  };

  if (loading) {
    return (
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: 'var(--text-muted)',
        }}
      >
        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading projects…</span>
      </div>
    );
  }

  if (projects.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '16px 20px',
          borderBottom: '1px solid var(--separator)',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: 'var(--gold-dim)',
            border: '1px solid rgba(245, 166, 35, 0.18)',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <FolderOpen size={14} color="var(--gold)" strokeWidth={2} />
        </div>
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text)',
              letterSpacing: '-0.015em',
              lineHeight: 1,
            }}
          >
            Your Projects ({projects.length})
          </h2>
        </div>
      </div>

      {/* Project list */}
      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {projects.map((p, i) => {
          const cfg = statusConfig[p.status] ?? statusConfig.draft;
          const Icon = cfg.icon;
          const isActive = p.id === currentProjectId;
          const isAnimated = p.status === 'generating' || p.status === 'compiling';

          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 20px',
                borderBottom: i < projects.length - 1 ? '1px solid var(--separator)' : 'none',
                cursor: 'pointer',
                background: isActive ? 'var(--glass-bg-heavy)' : 'transparent',
                borderLeft: isActive ? `2px solid var(--gold)` : '2px solid transparent',
                transition: 'background 0.15s ease',
                position: 'relative',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)';
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              {/* Status indicator */}
              <Icon
                size={15}
                color={cfg.dotColor}
                strokeWidth={2}
                style={{
                  flexShrink: 0,
                  animation: isAnimated ? 'spin 1s linear infinite' : 'none',
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: cfg.textColor,
                      fontWeight: 500,
                      flexShrink: 0,
                    }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {p.clipCount} clips
                  </span>
                  {p.completedClips > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                      {p.completedClips}/{p.clipCount} done
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {timeAgo(p.createdAt)}
                  </span>
                </div>
              </div>

              {p.status === 'completed' && (
                <Film size={13} color="var(--success)" style={{ flexShrink: 0 }} />
              )}

              {/* Delete button */}
              <button
                onClick={e => handleDelete(e, p.id, p.name)}
                title="Delete project"
                style={{
                  opacity: 0,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--error-dim)',
                  border: '1px solid rgba(255, 69, 58, 0.18)',
                  borderRadius: 7,
                  cursor: 'pointer',
                  color: 'var(--error)',
                  transition: 'opacity 0.15s, background 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 69, 58, 0.18)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0';
                }}
                className="delete-btn"
              >
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>

      {/* CSS to show delete button on row hover */}
      <style>{`
        div:hover > * > .delete-btn,
        div:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
