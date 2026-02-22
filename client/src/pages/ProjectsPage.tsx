import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, FolderOpen, Clock, CheckCircle2, Loader2, AlertCircle,
  Trash2, Film, ChevronRight, Sparkles, LayoutGrid, List,
} from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  clipCount: number;
  completedClips: number;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string; badgeClass: string }> = {
  draft:      { icon: Clock,        color: 'var(--text-dim)',  label: 'Draft',      badgeClass: 'badge-muted' },
  generating: { icon: Loader2,      color: 'var(--gold)',      label: 'Generating', badgeClass: 'badge-gold' },
  compiling:  { icon: Loader2,      color: 'var(--blue)',      label: 'Compiling',  badgeClass: 'badge-blue' },
  completed:  { icon: CheckCircle2, color: 'var(--success)',   label: 'Completed',  badgeClass: 'badge-success' },
  error:      { icon: AlertCircle,  color: 'var(--error)',     label: 'Error',      badgeClass: 'badge-error' },
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

export function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : (data.projects || []));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(ps => ps.filter(p => p.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpen = (id: string) => navigate('/pixar-ai', { state: { projectId: id } });

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total:     projects.length,
    active:    projects.filter(p => p.status === 'generating' || p.status === 'compiling').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  return (
    <div className="page-content">

      {/* Header */}
      <div className="animate-fade-up" style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <div className="section-label" style={{ marginBottom: 8 }}>
              Project Library
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 800,
                color: 'var(--text)',
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
              }}
            >
              All Projects
            </h1>
          </div>
          <button
            onClick={() => navigate('/pixar-ai')}
            className="btn-gold"
            style={{ marginTop: 4 }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Project
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--text)' },
            { label: 'Active', value: stats.active, color: 'var(--gold)' },
            { label: 'Completed', value: stats.completed, color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 24,
                  fontWeight: 800,
                  color: s.color,
                  letterSpacing: '-0.02em',
                }}
              >
                {loading ? '—' : s.value}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Search + view toggle */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search
              size={14}
              color="var(--text-dim)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              className="ns-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              style={{ paddingLeft: 36 }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            {(['list', 'grid'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '0 14px',
                  background: viewMode === mode ? 'var(--border)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: viewMode === mode ? 'var(--text)' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s',
                }}
              >
                {mode === 'list' ? <List size={15} /> : <LayoutGrid size={15} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '40px 0' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading projects…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="ns-card"
          style={{ padding: '80px 40px', textAlign: 'center' }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <Film size={32} color="var(--text-dim)" />
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            {search ? 'No matching projects' : 'No projects yet'}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32, maxWidth: 320, margin: '0 auto 32px' }}>
            {search
              ? `No projects match "${search}". Try a different search term.`
              : 'Start by creating your first Pixar AI video project.'}
          </p>
          {!search && (
            <button onClick={() => navigate('/pixar-ai')} className="btn-gold">
              <Sparkles size={14} />
              Create First Project
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* ── List view ── */
        <div
          className="animate-fade-up"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          {filtered.map((project, i) => {
            const cfg = statusConfig[project.status] ?? statusConfig.draft;
            const StatusIcon = cfg.icon;
            const isSpinning = project.status === 'generating' || project.status === 'compiling';
            const progress = project.clipCount > 0 ? (project.completedClips / project.clipCount) * 100 : 0;
            const isDeleting = deletingId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => handleOpen(project.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 24px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.background = 'var(--surface)')}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <StatusIcon
                    size={16}
                    color={cfg.color}
                    strokeWidth={2}
                    style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-body)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 5,
                    }}
                  >
                    {project.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {project.clipCount > 0 && (
                      <>
                        <div
                          style={{
                            width: 64,
                            height: 3,
                            background: 'var(--border)',
                            borderRadius: 2,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${progress}%`,
                              background: project.status === 'completed' ? 'var(--success)' : 'var(--gold)',
                              borderRadius: 2,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {project.completedClips}/{project.clipCount} clips
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                  {timeAgo(project.createdAt)}
                </span>

                <div className={`badge ${cfg.badgeClass}`} style={{ flexShrink: 0 }}>
                  {cfg.label}
                </div>

                <button
                  onClick={e => handleDelete(e, project.id, project.name)}
                  disabled={isDeleting}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                    color: 'var(--text-dim)',
                    opacity: 0,
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                  className="delete-btn"
                  onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--error)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)')}
                >
                  {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>

                <ChevronRight size={14} color="var(--text-dim)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}

          {/* Reveal delete buttons on row hover via CSS */}
          <style>{`
            div:hover > .delete-btn { opacity: 1 !important; }
          `}</style>
        </div>
      ) : (
        /* ── Grid view ── */
        <div
          className="animate-fade-up"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}
        >
          {filtered.map(project => {
            const cfg = statusConfig[project.status] ?? statusConfig.draft;
            const StatusIcon = cfg.icon;
            const isSpinning = project.status === 'generating' || project.status === 'compiling';
            const progress = project.clipCount > 0 ? (project.completedClips / project.clipCount) * 100 : 0;
            const isDeleting = deletingId === project.id;

            return (
              <div
                key={project.id}
                className="ns-card"
                onClick={() => handleOpen(project.id)}
                style={{
                  padding: '22px 24px',
                  cursor: 'pointer',
                  opacity: isDeleting ? 0.5 : 1,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StatusIcon
                      size={16}
                      color={cfg.color}
                      strokeWidth={2}
                      style={{ animation: isSpinning ? 'spin 1s linear infinite' : 'none' }}
                    />
                  </div>
                  <button
                    onClick={e => handleDelete(e, project.id, project.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 5,
                      borderRadius: 6,
                      color: 'var(--text-dim)',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--error)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)')}
                  >
                    {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>

                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--text)',
                    fontFamily: 'var(--font-display)',
                    marginBottom: 6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.name}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {project.clipCount} clips
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    · {timeAgo(project.createdAt)}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 14 }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      background: project.status === 'completed' ? 'var(--success)' : 'var(--gold)',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className={`badge ${cfg.badgeClass}`}>{cfg.label}</div>
                  <ChevronRight size={13} color="var(--text-dim)" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
