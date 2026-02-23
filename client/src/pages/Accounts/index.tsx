import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Play, X, Video, Check,
  ChevronRight, MoreVertical,
} from 'lucide-react';
import { api } from '../../hooks/useApi';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Account {
  id: number;
  name: string;
  platform: string;
  monthly_video_goal: number;
  default_product_id: number | null;
  default_avatar_id: number | null;
  notes: string | null;
  created_at: string;
}

interface AccountStats {
  account_id?: number;
  videos_all_time: number;
  videos_this_month: number;
  monthly_goal?: number;
  monthly_video_goal?: number;
  days_left_in_month?: number;
}

interface VideoMeta {
  id: number;
  account_id: number | null;
  product_id: number | null;
  video_style_id: number | null;
  status: string;
  file_path: string | null;
  thumbnail_path: string | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
  project_id: string;
}

interface Avatar {
  id: number;
  name: string;
  image_path: string;
  thumbnail_path: string | null;
}

interface Product { id: number; name: string; slug: string; }
interface VideoStyle { id: number; name: string; slug: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLATFORMS = ['TikTok', 'Instagram', 'Facebook', 'YouTube'];

const platformColors: Record<string, string> = {
  TikTok: '#a855f7',
  Instagram: '#f97316',
  Facebook: '#3b82f6',
  YouTube: '#ef4444',
};

const platformLabels: Record<string, string> = {
  TikTok: 'TK',
  Instagram: 'IG',
  Facebook: 'FB',
  YouTube: 'YT',
};

function PlatformBadge({ platform, size = 'md' }: { platform: string; size?: 'sm' | 'md' }) {
  const color = platformColors[platform] ?? '#6b7280';
  const label = platformLabels[platform] ?? platform?.slice(0, 2).toUpperCase() ?? '??';
  const dim = size === 'sm' ? 24 : 32;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: dim, height: dim, borderRadius: 8,
      background: color + '22', color, fontSize: size === 'sm' ? 9 : 11,
      fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0,
      border: `1px solid ${color}44`,
    }}>
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Circular Progress ─────────────────────────────────────────────────────────

function CircularProgress({ done, goal }: { done: number; goal: number }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  const ratio = Math.min(1, goal > 0 ? done / goal : 0);
  const stroke = ratio >= 0.75 ? '#34d399' : ratio >= 0.4 ? '#fbbf24' : '#f87171';

  return (
    <div style={{ position: 'relative', width: 148, height: 148 }}>
      <svg width="148" height="148" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="74" cy="74" r={r} fill="none" stroke="#2a2a2a" strokeWidth="8" />
        <circle
          cx="74" cy="74" r={r} fill="none"
          stroke={stroke} strokeWidth="8"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - ratio)}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>
          {done}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {goal}</div>
      </div>
    </div>
  );
}

// ── Account Form Modal ────────────────────────────────────────────────────────

function AccountModal({
  initial,
  products,
  onClose,
  onSave,
}: {
  initial?: Account;
  products: Product[];
  onClose: () => void;
  onSave: (a: Account) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    platform: initial?.platform ?? 'TikTok',
    monthly_video_goal: initial?.monthly_video_goal ?? 20,
    default_product_id: initial?.default_product_id?.toString() ?? '',
    notes: initial?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        platform: form.platform,
        monthly_video_goal: form.monthly_video_goal,
        default_product_id: form.default_product_id ? parseInt(form.default_product_id) : null,
        notes: form.notes.trim() || null,
      };
      let result: Account;
      if (initial) {
        result = await api.put<Account>(`/accounts/${initial.id}`, payload);
      } else {
        result = await api.post<Account>('/accounts', payload);
      }
      onSave(result);
    } catch { } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            {initial ? 'Edit Account' : 'New Account'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {[
          { label: 'Account Name *', key: 'name', type: 'text', placeholder: 'e.g. @Johnny_Appleseed' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>{f.label}</label>
            <input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
            />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Platform</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {PLATFORMS.map(p => {
              const active = form.platform === p;
              const color = platformColors[p];
              return (
                <button
                  key={p}
                  onClick={() => setForm(prev => ({ ...prev, platform: p }))}
                  style={{
                    flex: 1, padding: '7px 4px', borderRadius: 9, border: `1px solid ${active ? color : '#2a2a2a'}`,
                    background: active ? color + '22' : '#111', color: active ? color : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: 'var(--font-mono)',
                  }}
                >
                  {platformLabels[p]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Monthly Video Goal</label>
          <input
            type="number" min={1} max={200}
            value={form.monthly_video_goal}
            onChange={e => setForm(prev => ({ ...prev, monthly_video_goal: parseInt(e.target.value) || 20 }))}
            style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Default Product (optional)</label>
          <select
            value={form.default_product_id}
            onChange={e => setForm(prev => ({ ...prev, default_product_id: e.target.value }))}
            style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
          >
            <option value="">None</option>
            {products.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes about this account..."
            style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 9, padding: '9px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#2a2a2a', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.name.trim()}
            style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'linear-gradient(to right, #9333ea, #db2777)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: saving || !form.name.trim() ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Video Modal ────────────────────────────────────────────────────────

function AssignVideoModal({
  accountId,
  existingVideoIds,
  productsMap,
  onClose,
  onAssign,
}: {
  accountId: number;
  existingVideoIds: Set<number>;
  productsMap: Record<number, string>;
  onClose: () => void;
  onAssign: (video: VideoMeta) => void;
}) {
  const [allVideos, setAllVideos] = useState<VideoMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<VideoMeta[]>('/video-metadata')
      .then(vids => setAllVideos(vids.filter(v => v.account_id === null || !existingVideoIds.has(v.id))))
      .catch(() => setAllVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const assign = async (video: VideoMeta) => {
    const updated = await api.put<VideoMeta>(`/video-metadata/${video.id}`, { account_id: accountId });
    onAssign(updated);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: 24, width: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Assign Video</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>
          ) : allVideos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No unassigned videos available</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {allVideos.map(v => (
                <button
                  key={v.id}
                  onClick={() => assign(v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                    background: '#111', border: '1px solid #2a2a2a', borderRadius: 11,
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: '#1a1a1a', overflow: 'hidden', flexShrink: 0 }}>
                    {v.thumbnail_path ? (
                      <img src={v.thumbnail_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={14} color="#2a2a2a" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                      {v.product_id ? productsMap[v.product_id] ?? 'Video' : 'Video'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(v.created_at)}</div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Account Detail Panel ──────────────────────────────────────────────────────

function AccountDetail({
  account,
  products,
  avatars,
  onUpdate,
  onDeleted,
}: {
  account: Account;
  products: Product[];
  avatars: Avatar[];
  onUpdate: (a: Account) => void;
  onDeleted: () => void;
}) {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [showEdit, setShowEdit] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(account.monthly_video_goal.toString());
  const [productsMap, setProductsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    const map: Record<number, string> = {};
    products.forEach(p => { map[p.id] = p.name; });
    setProductsMap(map);
  }, [products]);

  useEffect(() => {
    const fetchData = async () => {
      const [statsResult, videosResult] = await Promise.allSettled([
        api.get<AccountStats>(`/accounts/${account.id}/stats`),
        api.get<VideoMeta[]>(`/video-metadata?account_id=${account.id}`),
      ]);
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
      if (videosResult.status === 'fulfilled') setVideos(videosResult.value);
    };
    fetchData();
  }, [account.id]);

  const now = new Date();
  const daysLeft = stats?.days_left_in_month ?? Math.ceil((new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - now.getTime()) / 86400000);

  const saveGoal = async () => {
    const goal = parseInt(goalInput) || 20;
    setEditingGoal(false);
    const updated = await api.put<Account>(`/accounts/${account.id}`, { monthly_video_goal: goal }).catch(() => null);
    if (updated) onUpdate(updated);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== account.name) return;
    await api.del(`/accounts/${account.id}`).catch(() => {});
    onDeleted();
  };

  const handleRemoveVideo = async (videoId: number) => {
    await api.put(`/video-metadata/${videoId}`, { account_id: null }).catch(() => {});
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const handleAssigned = (video: VideoMeta) => {
    setVideos(prev => [...prev, video]);
    setShowAssign(false);
  };

  const handleAvatarChange = async (avatarId: number) => {
    const updated = await api.put<Account>(`/accounts/${account.id}`, { default_avatar_id: avatarId }).catch(() => null);
    if (updated) onUpdate(updated);
    setShowAvatarPicker(false);
  };

  const defaultAvatar = avatars.find(a => a.id === account.default_avatar_id);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <PlatformBadge platform={account.platform} />
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em' }}>{account.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{account.platform}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowEdit(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, background: '#1a1a1a', border: '1px solid #2a2a2a', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12.5 }}
          >
            <Edit2 size={13} /> Edit
          </button>
        </div>
      </div>

      {/* Goal section */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 18, padding: '24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap' }}>
          <CircularProgress done={stats?.videos_this_month ?? 0} goal={account.monthly_video_goal} />
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Monthly Goal</div>
            {editingGoal ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveGoal(); if (e.key === 'Escape') setEditingGoal(false); }}
                  autoFocus
                  style={{ width: 80, background: '#111', border: '1px solid #a855f7', borderRadius: 8, padding: '6px 10px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                />
                <button onClick={saveGoal} style={{ padding: '6px 10px', borderRadius: 8, background: '#a855f7', border: 'none', color: '#fff', cursor: 'pointer' }}>
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingGoal(true); setGoalInput(account.monthly_video_goal.toString()); }}
                style={{ fontSize: 13, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#2a2a2a' }}
              >
                Goal: {account.monthly_video_goal} videos/month
              </button>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {[
                { label: 'This Month', val: stats?.videos_this_month ?? 0 },
                { label: 'All Time', val: stats?.videos_all_time ?? 0 },
                { label: 'Days Left', val: daysLeft },
              ].map(chip => (
                <div key={chip.label} style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: '8px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{chip.val}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{chip.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Default Avatar */}
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 18, padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Default Avatar</h3>
          <button
            onClick={() => setShowAvatarPicker(true)}
            style={{ fontSize: 12, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Change
          </button>
        </div>
        {defaultAvatar ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
              <img src={defaultAvatar.image_path} alt={defaultAvatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{defaultAvatar.name}</div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No default avatar set</div>
        )}
      </div>

      {/* Videos section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
            Videos <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({videos.length})</span>
          </h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowAssign(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1px dashed #3a3a3a', color: 'var(--text-secondary)', background: 'none', cursor: 'pointer', fontSize: 12 }}
            >
              <Plus size={12} /> Assign Video
            </button>
            <Link
              to={`/new-video?account_id=${account.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, background: 'linear-gradient(to right, #9333ea, #db2777)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 600 }}
            >
              <Plus size={12} /> Create Video
            </Link>
          </div>
        </div>

        {videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, fontSize: 13 }}>
            No videos assigned to this account
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                productName={video.product_id ? productsMap[video.product_id] : undefined}
                onRemove={() => handleRemoveVideo(video.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 14, padding: '16px 18px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#f87171' }}>Delete Account</h4>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px' }}>
          This is permanent. Type <strong style={{ color: 'var(--text)' }}>{account.name}</strong> to confirm.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder={account.name}
            style={{ flex: 1, background: '#111', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 9, padding: '8px 12px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
          />
          <button
            onClick={handleDelete}
            disabled={deleteConfirm !== account.name}
            style={{ padding: '8px 16px', borderRadius: 9, background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: deleteConfirm === account.name ? 'pointer' : 'not-allowed', fontSize: 12.5, opacity: deleteConfirm === account.name ? 1 : 0.5 }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <AccountModal
          initial={account}
          products={products}
          onClose={() => setShowEdit(false)}
          onSave={a => { onUpdate(a); setShowEdit(false); }}
        />
      )}
      {showAssign && (
        <AssignVideoModal
          accountId={account.id}
          existingVideoIds={new Set(videos.map(v => v.id))}
          productsMap={productsMap}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssigned}
        />
      )}
      {showAvatarPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 20, padding: 24, width: 400, maxHeight: '60vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Pick Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {avatars.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No avatars yet</div>
              ) : avatars.map(a => (
                <button key={a.id} onClick={() => handleAvatarChange(a.id)} style={{ background: 'none', border: `2px solid ${account.default_avatar_id === a.id ? '#a855f7' : '#2a2a2a'}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer', padding: 0 }}>
                  <div style={{ aspectRatio: '1/1' }}>
                    <img src={a.image_path} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '6px 8px', fontSize: 10.5, color: 'var(--text)', textAlign: 'left', background: '#111', fontWeight: 500 }}>{a.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mini Video Card (for account detail) ──────────────────────────────────────

function VideoCard({ video, productName, onRemove }: { video: VideoMeta; productName?: string; onRemove: () => void; }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menuOpen]);

  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <div style={{ aspectRatio: '9/16', background: '#111', position: 'relative', overflow: 'hidden' }}>
        {video.thumbnail_path ? (
          <img src={video.thumbnail_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={16} color="#2a2a2a" />
          </div>
        )}
        {productName && (
          <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 5px', fontSize: 9, color: '#fff', fontWeight: 600, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {productName}
          </div>
        )}
        <div ref={menuRef} style={{ position: 'absolute', bottom: 5, right: 5 }}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
          >
            <MoreVertical size={11} />
          </button>
          {menuOpen && (
            <div style={{ position: 'absolute', bottom: 28, right: 0, background: '#222', border: '1px solid #333', borderRadius: 9, padding: 4, minWidth: 130, zIndex: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
              <button
                onClick={() => { setMenuOpen(false); onRemove(); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', fontSize: 12, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6 }}
              >
                Remove from account
              </button>
            </div>
          )}
        </div>
      </div>
      <div style={{ padding: '6px 8px' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{formatDate(video.created_at)}</div>
      </div>
    </div>
  );
}

// ── Accounts Page ─────────────────────────────────────────────────────────────

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [statsMap, setStatsMap] = useState<Record<number, AccountStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get<Account[]>('/accounts'),
      api.get<Product[]>('/products'),
      api.get<Avatar[]>('/avatars'),
    ]).then(([accs, prods, avs]) => {
      if (accs.status === 'fulfilled') setAccounts(accs.value);
      if (prods.status === 'fulfilled') setProducts(prods.value);
      if (avs.status === 'fulfilled') setAvatars(avs.value);
      setLoading(false);
    });
  }, []);

  // Fetch all stats once accounts are loaded
  useEffect(() => {
    if (accounts.length === 0) return;
    Promise.allSettled(accounts.map(a => api.get<AccountStats>(`/accounts/${a.id}/stats`)))
      .then(results => {
        const map: Record<number, AccountStats> = {};
        results.forEach((r, i) => {
          if (r.status === 'fulfilled') map[accounts[i].id] = r.value;
        });
        setStatsMap(map);
      });
  }, [accounts]);

  const handleCreated = (a: Account) => {
    setAccounts(prev => [a, ...prev]);
    setSelected(a);
    setShowModal(false);
  };

  const handleUpdated = (a: Account) => {
    setAccounts(prev => prev.map(x => x.id === a.id ? a : x));
    setSelected(a);
  };

  const handleDeleted = () => {
    if (!selected) return;
    setAccounts(prev => prev.filter(a => a.id !== selected.id));
    setSelected(null);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--nav-h))', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: 280, flexShrink: 0, borderRight: '1px solid #2a2a2a',
        background: '#111', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 18px 12px', borderBottom: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>Accounts</h1>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px',
                borderRadius: 8, background: 'linear-gradient(to right, #9333ea, #db2777)',
                border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              <Plus size={12} /> New
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {loading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          ) : accounts.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              <div style={{ marginBottom: 10 }}>No accounts yet</div>
              <button
                onClick={() => setShowModal(true)}
                style={{ fontSize: 12.5, color: '#a855f7', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Create your first account
              </button>
            </div>
          ) : (
            accounts.map(a => {
              const stats = statsMap[a.id];
              const done = stats?.videos_this_month ?? 0;
              const goal = a.monthly_video_goal || 20;
              const ratio = Math.min(1, done / goal);
              const color = ratio >= 0.75 ? '#34d399' : ratio >= 0.4 ? '#fbbf24' : '#f87171';
              const isActive = selected?.id === a.id;

              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 10px', borderRadius: 11, border: 'none',
                    background: isActive ? 'rgba(168,85,247,0.12)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', marginBottom: 2,
                    borderLeft: `3px solid ${isActive ? '#a855f7' : 'transparent'}`,
                    transition: 'all 0.12s',
                  }}
                >
                  <PlatformBadge platform={a.platform} size="sm" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.name}
                    </div>
                    <div style={{ fontSize: 10.5, color, fontFamily: 'var(--font-mono)', marginTop: 1 }}>
                      {done}/{goal} this month
                    </div>
                  </div>
                  <ChevronRight size={12} color={isActive ? '#a855f7' : 'var(--text-muted)'} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#0f0f0f' }}>
        {selected ? (
          <AccountDetail
            key={selected.id}
            account={selected}
            products={products}
            avatars={avatars}
            onUpdate={handleUpdated}
            onDeleted={handleDeleted}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 40, opacity: 0.15 }}>👤</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Select an account to view details</div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'linear-gradient(to right, #9333ea, #db2777)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
            >
              <Plus size={14} /> New Account
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <AccountModal
          products={products}
          onClose={() => setShowModal(false)}
          onSave={handleCreated}
        />
      )}
    </div>
  );
}
