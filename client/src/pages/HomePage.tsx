import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Clock, FolderOpen, CheckCircle2, Loader2, AlertCircle,
  ChevronRight, Film, ArrowRight, TrendingUp, Zap, Star, Activity,
} from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  clipCount: number;
  completedClips: number;
}

const studios = [
  {
    id: 'pixar-ai',
    title: 'Pixar AI',
    emoji: '✨',
    description: 'Generate cinematic Pixar-style videos powered by Google Veo 3.1 and Flow.',
    path: '/pixar-ai',
    active: true,
    gradient: 'linear-gradient(135deg, rgba(245,166,35,0.10) 0%, rgba(168,85,247,0.06) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(245,166,35,0.18) 0%, rgba(168,85,247,0.12) 100%)',
    accentColor: '#f5a623',
    accentBorder: 'rgba(245,166,35,0.30)',
    glowColor: 'rgba(245,166,35,0.15)',
    tag: 'Active',
  },
  {
    id: 'anime-studio',
    title: 'Anime Studio',
    emoji: '🎌',
    description: 'Dynamic anime-style animated content with AI-generated characters and scenes.',
    path: '/anime-studio',
    active: false,
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(168,85,247,0.05) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.10) 100%)',
    accentColor: '#ec4899',
    accentBorder: 'rgba(236,72,153,0.28)',
    glowColor: 'rgba(236,72,153,0.12)',
    tag: 'Soon',
  },
  {
    id: 'short-film',
    title: 'Short Film',
    emoji: '🎬',
    description: 'Professional-grade cinematic shorts with AI cinematography and editing.',
    path: '/short-film',
    active: false,
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(20,184,166,0.05) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(20,184,166,0.10) 100%)',
    accentColor: '#3b82f6',
    accentBorder: 'rgba(59,130,246,0.28)',
    glowColor: 'rgba(59,130,246,0.12)',
    tag: 'Soon',
  },
  {
    id: 'documentary',
    title: 'Documentary',
    emoji: '📽️',
    description: 'Craft compelling narratives with AI research, voiceover, and visual tools.',
    path: '/documentary',
    active: false,
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(20,184,166,0.05) 100%)',
    gradientHover: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(20,184,166,0.10) 100%)',
    accentColor: '#34d399',
    accentBorder: 'rgba(52,211,153,0.28)',
    glowColor: 'rgba(52,211,153,0.12)',
    tag: 'Soon',
  },
];

const statsConfig = [
  {
    label: 'Projects',
    key: 'total' as const,
    icon: FolderOpen,
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(20,184,166,0.08) 100%)',
    border: 'rgba(59,130,246,0.22)',
    delay: 'delay-1',
  },
  {
    label: 'Active',
    key: 'active' as const,
    icon: Activity,
    color: '#f5a623',
    gradient: 'linear-gradient(135deg, rgba(245,166,35,0.15) 0%, rgba(236,72,153,0.08) 100%)',
    border: 'rgba(245,166,35,0.22)',
    delay: 'delay-2',
  },
  {
    label: 'Completed',
    key: 'completed' as const,
    icon: CheckCircle2,
    color: '#34d399',
    gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(59,130,246,0.08) 100%)',
    border: 'rgba(52,211,153,0.22)',
    delay: 'delay-3',
  },
  {
    label: 'Drafts',
    key: 'drafts' as const,
    icon: Clock,
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(59,130,246,0.08) 100%)',
    border: 'rgba(168,85,247,0.22)',
    delay: 'delay-4',
  },
];

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  draft:      { icon: Clock,        color: 'var(--text-dim)',  label: 'Draft' },
  generating: { icon: Loader2,      color: 'var(--gold)',      label: 'Generating' },
  compiling:  { icon: Loader2,      color: 'var(--blue)',      label: 'Compiling' },
  completed:  { icon: CheckCircle2, color: 'var(--success)',   label: 'Done' },
  error:      { icon: AlertCircle,  color: 'var(--error)',     label: 'Error' },
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

export function HomePage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(d => { setProjects(Array.isArray(d) ? d : (d.projects || [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const stats = {
    total:     projects.length,
    active:    projects.filter(p => p.status === 'generating' || p.status === 'compiling').length,
    completed: projects.filter(p => p.status === 'completed').length,
    drafts:    projects.filter(p => p.status === 'draft').length,
  };

  const latest = projects.slice(0, 6);

  return (
    <div className="page-content">

      {/* ── Hero ── */}
      <div className="animate-fade-up" style={{ marginBottom: 52 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div>
            {/* Gradient pill label */}
            <div
              className="accent-pill"
              style={{ marginBottom: 16 }}
            >
              <Sparkles size={10} color="currentColor" />
              NonTTS Studio · AI Video Production
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 5.5vw, 58px)',
                fontWeight: 800,
                lineHeight: 1.04,
                letterSpacing: '-0.02em',
                color: 'var(--text)',
                marginBottom: 16,
              }}
            >
              {greeting}<span style={{ color: 'var(--gold)' }}>.</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 440, lineHeight: 1.65 }}>
              Your AI-powered video production studio. Create cinematic content with
              Google Flow &amp; Veo&nbsp;3.1.
            </p>
          </div>

          {/* Clock widget with gradient border */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(59,130,246,0.06) 100%)',
              border: '1px solid rgba(168,85,247,0.18)',
              borderRadius: 16,
              padding: '20px 28px',
              textAlign: 'right',
              flexShrink: 0,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow accent top-right */}
            <div style={{
              position: 'absolute', top: -20, right: -20,
              width: 80, height: 80,
              background: 'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 34,
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--text) 0%, rgba(168,85,247,0.9) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              {time}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 6 }}>
              {date}
            </div>
          </div>
        </div>

        {/* ── Stats row — colorful gradient cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {statsConfig.map(s => (
            <div
              key={s.label}
              className={`animate-fade-up ${s.delay}`}
              style={{
                background: s.gradient,
                border: `1px solid ${s.border}`,
                borderRadius: 'var(--radius)',
                padding: '20px 22px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${s.border}`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              {/* Background glow blob */}
              <div style={{
                position: 'absolute', bottom: -16, right: -16,
                width: 64, height: 64,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${s.color}30 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <s.icon size={15} color={s.color} strokeWidth={2} />
                {(stats[s.key] ?? 0) > 0 && <TrendingUp size={10} color={s.color} style={{ opacity: 0.6 }} />}
              </div>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  color: s.color,
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}
              >
                {loading ? '—' : stats[s.key]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5, fontFamily: 'var(--font-body)', fontWeight: 500 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Studio Modes ── */}
      <div className="animate-fade-up delay-2" style={{ marginBottom: 52 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            {/* Animated gradient section title */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                background: 'linear-gradient(120deg, var(--text) 0%, rgba(168,85,247,0.85) 60%, var(--text) 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 7s linear infinite',
              }}
            >
              Studio Modes
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>
              Choose your creative workflow
            </p>
          </div>
          <Zap size={15} color="var(--gold)" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {studios.map((s, i) => (
            <Link
              key={s.id}
              to={s.path}
              style={{ textDecoration: 'none' }}
              className={`animate-fade-up delay-${i + 1}`}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                style={{
                  background: hovered === s.id ? s.gradientHover : s.gradient,
                  border: `1px solid ${hovered === s.id ? s.accentBorder : 'var(--border)'}`,
                  borderRadius: 16,
                  padding: '26px 28px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.24s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: hovered === s.id ? 'translateY(-3px)' : 'none',
                  boxShadow: hovered === s.id ? `0 16px 48px ${s.glowColor}` : 'none',
                }}
              >
                {/* Background glow */}
                <div style={{
                  position: 'absolute', top: -40, right: -40,
                  width: 140, height: 140, borderRadius: '50%',
                  background: `radial-gradient(circle, ${s.accentColor}20 0%, transparent 70%)`,
                  transition: 'opacity 0.3s',
                  opacity: hovered === s.id ? 1 : 0.4,
                  pointerEvents: 'none',
                }} />

                {/* Corner badge */}
                <div
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: s.active
                      ? `linear-gradient(135deg, ${s.accentColor}22, rgba(168,85,247,0.12))`
                      : 'rgba(255,255,255,0.04)',
                    color: s.active ? s.accentColor : 'var(--text-dim)',
                    border: `1px solid ${s.active ? s.accentBorder : 'var(--border)'}`,
                  }}
                >
                  {s.tag}
                </div>

                {/* Emoji */}
                <div
                  style={{
                    fontSize: 36, lineHeight: 1, marginBottom: 16,
                    filter: hovered === s.id ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' : 'none',
                    transition: 'filter 0.2s, transform 0.2s',
                    transform: hovered === s.id ? 'scale(1.08)' : 'scale(1)',
                  }}
                >
                  {s.emoji}
                </div>

                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 20,
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 8,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {s.title}
                </div>

                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.65, flex: 1, marginBottom: 20 }}>
                  {s.description}
                </p>

                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                    color: s.active ? s.accentColor : 'var(--text-muted)',
                  }}
                >
                  {s.active ? 'Launch Studio' : 'Coming Soon'}
                  <ArrowRight
                    size={13}
                    strokeWidth={2.5}
                    style={{
                      transition: 'transform 0.18s',
                      transform: hovered === s.id ? 'translateX(4px)' : 'none',
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Projects ── */}
      <div className="animate-fade-up delay-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.01em',
                background: 'linear-gradient(120deg, var(--text) 0%, rgba(59,130,246,0.85) 60%, var(--text) 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'shimmer 8s linear infinite',
              }}
            >
              Recent Projects
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 3 }}>Your latest video work</p>
          </div>
          <Link
            to="/projects"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              textDecoration: 'none', fontSize: 13, fontWeight: 600,
              color: 'var(--gold)', fontFamily: 'var(--font-body)',
            }}
          >
            View all <ChevronRight size={14} />
          </Link>
        </div>

        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Subtle top gradient line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.4), rgba(245,166,35,0.4), rgba(59,130,246,0.4), transparent)',
          }} />

          {loading ? (
            <div style={{ padding: '40px 28px', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)' }}>
              <Loader2 size={16} className="animate-spin" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading projects…</span>
            </div>
          ) : latest.length === 0 ? (
            <div style={{ padding: '64px 28px', textAlign: 'center' }}>
              <div
                style={{
                  width: 64, height: 64,
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(59,130,246,0.08))',
                  border: '1px solid rgba(168,85,247,0.18)',
                  borderRadius: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Film size={28} color="var(--purple)" />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                No projects yet
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28 }}>
                Create your first Pixar AI video project to get started.
              </p>
              <Link to="/pixar-ai" className="btn-gold">
                <Sparkles size={14} />
                Create First Project
              </Link>
            </div>
          ) : (
            latest.map((project, i) => {
              const cfg = statusConfig[project.status] ?? statusConfig.draft;
              const StatusIcon = cfg.icon;
              const isSpinning = project.status === 'generating' || project.status === 'compiling';
              const progress = project.clipCount > 0 ? (project.completedClips / project.clipCount) * 100 : 0;

              return (
                <Link
                  key={project.id}
                  to="/pixar-ai"
                  state={{ projectId: project.id }}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '14px 24px',
                      borderBottom: i < latest.length - 1 ? '1px solid var(--separator)' : 'none',
                      transition: 'background 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <StatusIcon
                      size={15}
                      color={cfg.color}
                      strokeWidth={2}
                      style={{ flexShrink: 0, animation: isSpinning ? 'spin 1s linear infinite' : 'none' }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 500, fontSize: 14, color: 'var(--text)',
                          fontFamily: 'var(--font-body)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          marginBottom: 4,
                        }}
                      >
                        {project.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {project.status === 'completed' && progress > 0 && (
                          <div style={{ width: 56, height: 2, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--success), var(--teal))', borderRadius: 2 }} />
                          </div>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {project.clipCount} clips
                        </span>
                        {project.completedClips > 0 && (
                          <span style={{ fontSize: 11, color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>
                            {project.completedClips}/{project.clipCount} done
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {timeAgo(project.createdAt)}
                    </span>

                    <div
                      style={{
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.05em',
                        color: cfg.color,
                        background: `${cfg.color}16`,
                        border: `1px solid ${cfg.color}30`,
                        flexShrink: 0,
                      }}
                    >
                      {cfg.label}
                    </div>

                    <ChevronRight size={13} color="var(--text-dim)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Quick tip — gradient version */}
        {!loading && projects.length > 0 && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginTop: 14, padding: '14px 18px',
              background: 'linear-gradient(135deg, rgba(245,166,35,0.07), rgba(168,85,247,0.05))',
              border: '1px solid rgba(245,166,35,0.18)',
              borderRadius: 12,
            }}
          >
            <Star size={13} color="var(--gold)" strokeWidth={2.5} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
              <strong style={{ color: 'var(--gold)', fontWeight: 700 }}>Tip:</strong>{' '}
              Use the AI assistant in Pixar AI to auto-generate prompts for all your clips at once.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
