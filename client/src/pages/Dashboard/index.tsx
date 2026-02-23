import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Users, Loader2, BookMarked,
  Play, MoreVertical, Plus, Video,
} from 'lucide-react';
import { api } from '../../hooks/useApi';

// ── Types ────────────────────────────────────────────────────────────────────

interface MonthlyStats {
  total_this_month: number;
  by_account: { account_id: number; account_name: string; count: number; goal: number }[];
  overall_goal: number;
}

interface Account {
  id: number;
  name: string;
  platform: string;
  monthly_video_goal: number;
  default_avatar_id: number | null;
  notes: string | null;
}

interface AccountStats {
  account_id?: number;
  videos_this_month: number;
  videos_all_time: number;
  monthly_goal?: number;
  monthly_video_goal?: number;
  days_left_in_month?: number;
}

interface VideoMeta {
  id: number;
  project_id: string;
  account_id: number | null;
  product_id: number | null;
  video_style_id: number | null;
  status: string;
  file_path: string | null;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
  prehook_style: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  clipCount: number;
  completedClips: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function platformBadge(platform: string) {
  const map: Record<string, { label: string; color: string }> = {
    TikTok: { label: 'TK', color: '#a855f7' },
    Instagram: { label: 'IG', color: '#f97316' },
    Facebook: { label: 'FB', color: '#3b82f6' },
    YouTube: { label: 'YT', color: '#ef4444' },
  };
  const p = map[platform] ?? { label: platform?.slice(0, 2).toUpperCase() ?? '??', color: '#6b7280' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 7,
        background: p.color + '22',
        color: p.color,
        fontSize: 10,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        flexShrink: 0,
        border: `1px solid ${p.color}44`,
      }}
    >
      {p.label}
    </span>
  );
}

function goalColor(ratio: number) {
  if (ratio >= 0.75) return '#34d399';
  if (ratio >= 0.4) return '#fbbf24';
  return '#f87171';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  progress?: number; // 0–1
  color?: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, sub, progress, color = '#a855f7', loading }: StatCardProps) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '20px 22px',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: color + '18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
          }}
        >
          {icon}
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '-0.01em' }}>
          {label}
        </span>
      </div>

      {loading ? (
        <div style={{ height: 36, display: 'flex', alignItems: 'center' }}>
          <Loader2 size={18} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {value}
          </div>
          {sub && (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
          )}
          {progress !== undefined && (
            <div style={{ marginTop: 10, height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round(progress * 100))}%`,
                  background: `linear-gradient(to right, #a855f7, #ec4899)`,
                  borderRadius: 99,
                  transition: 'width 0.6s ease',
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({ video, accountName, styleName, productName, onDelete }: {
  video: VideoMeta;
  accountName?: string;
  styleName?: string;
  productName?: string;
  onDelete: (id: number) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleDelete = async () => {
    setMenuOpen(false);
    if (!confirm('Delete this video record?')) return;
    try {
      await api.del(`/video-metadata/${video.id}`);
      onDelete(video.id);
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', position: 'relative' }}>
      {/* Thumbnail — 9:16 */}
      <div style={{ aspectRatio: '9/16', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
        {video.thumbnail_path ? (
          <img
            src={video.thumbnail_path}
            alt="thumbnail"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(168,85,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Play size={16} color="#a855f7" />
            </div>
          </div>
        )}

        {/* Badges overlay */}
        {productName && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
            borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 600,
            maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {productName}
          </div>
        )}
        {styleName && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(168,85,247,0.75)', backdropFilter: 'blur(6px)',
            borderRadius: 6, padding: '2px 7px', fontSize: 10, color: '#fff', fontWeight: 600,
          }}>
            {styleName}
          </div>
        )}

        {/* Three-dot menu */}
        <div ref={menuRef} style={{ position: 'absolute', bottom: 8, right: 8 }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            }}
          >
            <MoreVertical size={13} />
          </button>
          {menuOpen && (
            <div style={{
              position: 'absolute', bottom: 34, right: 0,
              background: 'var(--card-hover)', border: '1px solid var(--border-bright)', borderRadius: 10, padding: 4,
              minWidth: 140, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {video.file_path && (
                <a
                  href={video.file_path}
                  download
                  style={{ display: 'block', padding: '7px 12px', fontSize: 12.5, color: 'var(--text)', textDecoration: 'none', borderRadius: 7 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg-heavy)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  Download
                </a>
              )}
              <button
                onClick={handleDelete}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '7px 12px', fontSize: 12.5, color: '#f87171',
                  background: 'none', border: 'none', cursor: 'pointer', borderRadius: 7,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Meta */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 2 }}>
          {accountName ?? 'Unassigned'}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(video.created_at)}</span>
          {video.duration_seconds != null && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {video.duration_seconds}s</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Account Goal Row ──────────────────────────────────────────────────────────

function AccountGoalRow({ account, stats }: { account: Account; stats: AccountStats | null }) {
  const goal = account.monthly_video_goal || 20;
  const done = stats?.videos_this_month ?? 0;
  const ratio = Math.min(1, done / goal);
  const color = goalColor(ratio);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {platformBadge(account.platform)}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {account.name}
        </div>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.round(ratio * 100)}%`,
              background: color,
              borderRadius: 99,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>
      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color, flexShrink: 0 }}>
        {done}/{goal}
      </span>
    </div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────

export function Dashboard() {
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountStatsMap, setAccountStatsMap] = useState<Record<number, AccountStats>>({});
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [scriptsCount, setScriptsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Lookup maps
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});
  const [stylesMap, setStylesMap] = useState<Record<number, string>>({});
  const [accountsMap, setAccountsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [monthly, accs, vids, projs, scripts, products, styles] = await Promise.allSettled([
          api.get<MonthlyStats>('/video-metadata/stats/monthly'),
          api.get<Account[]>('/accounts'),
          api.get<VideoMeta[]>('/video-metadata'),
          api.get<Project[]>('/projects'),
          api.get<any[]>('/scripts'),
          api.get<any[]>('/products'),
          api.get<any[]>('/video-styles'),
        ]);

        if (monthly.status === 'fulfilled') setMonthlyStats(monthly.value);
        if (accs.status === 'fulfilled') {
          setAccounts(accs.value);
          const map: Record<number, string> = {};
          accs.value.forEach(a => { map[a.id] = a.name; });
          setAccountsMap(map);
        }
        if (vids.status === 'fulfilled') {
          const sorted = [...vids.value].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setVideos(sorted);
        }
        if (projs.status === 'fulfilled') setProjects(projs.value);
        if (scripts.status === 'fulfilled') setScriptsCount(scripts.value.length);
        if (products.status === 'fulfilled') {
          const map: Record<number, string> = {};
          (products.value as any[]).forEach(p => { map[p.id] = p.name; });
          setProductsMap(map);
        }
        if (styles.status === 'fulfilled') {
          const map: Record<number, string> = {};
          (styles.value as any[]).forEach(s => { map[s.id] = s.name; });
          setStylesMap(map);
        }
      } catch {
        // fallback to empty state
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch per-account stats once accounts are loaded
  useEffect(() => {
    if (accounts.length === 0) return;
    Promise.allSettled(
      accounts.map(a => api.get<AccountStats>(`/accounts/${a.id}/stats`))
    ).then(results => {
      const map: Record<number, AccountStats> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') map[accounts[i].id] = r.value;
      });
      setAccountStatsMap(map);
    });
  }, [accounts]);

  const inProgress = projects.filter(p => p.status === 'generating').length;
  const recentVideos = videos.slice(0, 6);
  const overallGoal = monthlyStats?.overall_goal ?? 0;
  const totalThisMonth = monthlyStats?.total_this_month ?? 0;

  const handleDeleteVideo = (id: number) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1300, margin: '0 auto' }}>

      {/* ── ROW 1: Stat cards ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard
          icon={<Video size={17} />}
          label="Videos This Month"
          value={totalThisMonth}
          sub={overallGoal > 0 ? `of ${overallGoal} goal` : 'No goal set'}
          progress={overallGoal > 0 ? totalThisMonth / overallGoal : 0}
          color="#a855f7"
          loading={loading}
        />
        <StatCard
          icon={<Users size={17} />}
          label="Active Accounts"
          value={accounts.length}
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          icon={<Loader2 size={17} />}
          label="In Progress"
          value={inProgress}
          color="#fbbf24"
          loading={loading}
        />
        <StatCard
          icon={<BookMarked size={17} />}
          label="Saved Scripts"
          value={scriptsCount}
          color="#34d399"
          loading={loading}
        />
      </div>

      {/* ── ROW 2: Two columns ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* LEFT: Recent Videos (60%) */}
        <div style={{ flex: '0 0 58%', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              Recent Videos
            </h2>
            <Link
              to="/library"
              style={{ fontSize: 12.5, color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, aspectRatio: '9/16' }} />
              ))}
            </div>
          ) : recentVideos.length === 0 ? (
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16,
              padding: '48px 24px', textAlign: 'center',
            }}>
              <Video size={32} color="var(--border-bright)" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No videos yet</div>
              <Link
                to="/new-video"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14,
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(to right, #9333ea, #db2777)', color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <Plus size={14} /> Create Video
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {recentVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  accountName={video.account_id ? accountsMap[video.account_id] : undefined}
                  productName={video.product_id ? productsMap[video.product_id] : undefined}
                  styleName={video.video_style_id ? stylesMap[video.video_style_id] : undefined}
                  onDelete={handleDeleteVideo}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Account Goals (40%) */}
        <div style={{ flex: '0 0 calc(42% - 20px)', minWidth: 240 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              Account Goals
            </h2>
            <Link
              to="/accounts"
              style={{ fontSize: 12.5, color: '#a855f7', textDecoration: 'none', fontWeight: 500 }}
            >
              Manage →
            </Link>
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '12px 16px' }}>
            {loading ? (
              <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={20} color="var(--text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : accounts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No accounts yet
              </div>
            ) : (
              accounts.map(account => (
                <AccountGoalRow
                  key={account.id}
                  account={account}
                  stats={accountStatsMap[account.id] ?? null}
                />
              ))
            )}

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexDirection: 'column' }}>
              <Link
                to="/accounts"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  border: '1px dashed var(--border-bright)', color: 'var(--text-secondary)',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#a855f7';
                  e.currentTarget.style.color = '#a855f7';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-bright)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <Plus size={13} /> New Account
              </Link>

              <Link
                to="/new-video"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(to right, #9333ea, #db2777)', color: '#fff',
                  textDecoration: 'none',
                }}
              >
                <TrendingUp size={13} /> Quick Create
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
