import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search, Play, MoreVertical, X, Download, Trash2,
  Edit2, Check, ChevronDown, Plus, Film,
} from 'lucide-react';
import { api } from '../../hooks/useApi';

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface Avatar {
  id: number;
  name: string;
  image_path: string;
  thumbnail_path: string | null;
  description: string | null;
  style_tags: string | null;
  elevenlabs_voice_id: string | null;
  voice_label: string | null;
  account_id: number | null;
  created_at: string;
}

interface Script {
  id: number;
  product_id: number | null;
  video_style_id: number | null;
  title: string | null;
  script_text: string;
  clip_prompts: string | null;
  performance_notes: string | null;
  created_at: string;
}

interface Account { id: number; name: string; platform: string; }
interface Product { id: number; name: string; slug: string; }
interface VideoStyle { id: number; name: string; slug: string; }

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ── Tab Button ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px',
        borderRadius: 10,
        border: 'none',
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-body)',
        background: active ? 'rgba(168,85,247,0.15)' : 'transparent',
        color: active ? '#a855f7' : 'var(--text-secondary)',
        borderBottom: active ? '2px solid #a855f7' : '2px solid transparent',
        borderRadius: active ? '10px 10px 0 0' : '10px 10px 0 0',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

// ── Filter Select ─────────────────────────────────────────────────────────────

function FilterSelect({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 9,
          padding: '7px 30px 7px 11px',
          fontSize: 12.5,
          color: value ? 'var(--text)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
    </div>
  );
}

// ── Video Detail Panel ────────────────────────────────────────────────────────

function VideoDetailPanel({
  video,
  accounts,
  productsMap,
  stylesMap,
  accountsMap,
  onClose,
  onUpdate,
  onDelete,
}: {
  video: VideoMeta;
  accounts: Account[];
  productsMap: Record<number, string>;
  stylesMap: Record<number, string>;
  accountsMap: Record<number, string>;
  onClose: () => void;
  onUpdate: (v: VideoMeta) => void;
  onDelete: (id: number) => void;
}) {
  const [notes, setNotes] = useState(video.notes ?? '');
  const [accountId, setAccountId] = useState<string>(video.account_id?.toString() ?? '');
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    try {
      const updated = await api.put<VideoMeta>(`/video-metadata/${video.id}`, { notes });
      onUpdate(updated);
    } catch { } finally { setSaving(false); }
  };

  const saveAccount = async (val: string) => {
    setAccountId(val);
    try {
      const updated = await api.put<VideoMeta>(`/video-metadata/${video.id}`, { account_id: val ? parseInt(val) : null });
      onUpdate(updated);
    } catch { }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this video record? This cannot be undone.')) return;
    try {
      await api.del(`/video-metadata/${video.id}`);
      onDelete(video.id);
      onClose();
    } catch { }
  };

  const handleShare = async () => {
    if (!video.file_path) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: productsMap[video.product_id!] ?? 'Video', url: video.file_path });
      } catch { }
    } else {
      navigator.clipboard.writeText(window.location.origin + video.file_path).catch(() => {});
      alert('Link copied to clipboard');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
      background: '#141414', borderLeft: '1px solid #2a2a2a',
      zIndex: 50, display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
      animation: 'slideInRight 0.2s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {video.product_id ? productsMap[video.product_id] ?? 'Video' : 'Video'}
          </div>
          {video.video_style_id && (
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
              {stylesMap[video.video_style_id]}
            </div>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
          <X size={18} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Video preview */}
        <div style={{ aspectRatio: '9/16', background: '#111', borderRadius: 12, overflow: 'hidden', marginBottom: 18 }}>
          {video.file_path ? (
            <video
              controls
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              src={video.file_path}
            />
          ) : video.thumbnail_path ? (
            <img src={video.thumbnail_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Play size={28} color="#2a2a2a" />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Download to preview</span>
            </div>
          )}
        </div>

        {/* Meta */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Created
          </label>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>{formatDate(video.created_at)}</div>
        </div>

        {/* Account */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Account
          </label>
          <select
            value={accountId}
            onChange={e => saveAccount(e.target.value)}
            style={{
              width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: 9, padding: '8px 12px', fontSize: 13, color: 'var(--text)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <option value="">Unassigned</option>
            {accounts.map(a => <option key={a.id} value={a.id.toString()}>{a.name}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Notes
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Add notes..."
            style={{
              width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: 9, padding: '8px 12px', fontSize: 13, color: 'var(--text)',
              fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 80,
              boxSizing: 'border-box',
            }}
          />
          {saving && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Saving…</div>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {video.file_path && (
            <a
              href={video.file_path}
              download
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: '#1a1a1a', border: '1px solid #2a2a2a', color: 'var(--text)',
                textDecoration: 'none',
              }}
            >
              <Download size={14} /> Download
            </a>
          )}
          <button
            onClick={handleShare}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#1a1a1a', border: '1px solid #2a2a2a', color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            Share
          </button>
          <button
            onClick={handleDelete}
            style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '9px 12px', borderRadius: 10, fontSize: 13,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', cursor: 'pointer',
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Videos Tab ────────────────────────────────────────────────────────────────

function VideosTab({ accounts, products, styles }: { accounts: Account[]; products: Product[]; styles: VideoStyle[]; }) {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStyle, setFilterStyle] = useState('');
  const [filterMonth, setFilterMonth] = useState(currentMonth());
  const [selected, setSelected] = useState<VideoMeta | null>(null);

  const productsMap: Record<number, string> = {};
  products.forEach(p => { productsMap[p.id] = p.name; });
  const stylesMap: Record<number, string> = {};
  styles.forEach(s => { stylesMap[s.id] = s.name; });
  const accountsMap: Record<number, string> = {};
  accounts.forEach(a => { accountsMap[a.id] = a.name; });

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterAccount) params.set('account_id', filterAccount);
      if (filterProduct) params.set('product_id', filterProduct);
      if (filterMonth) params.set('month', filterMonth);
      const data = await api.get<VideoMeta[]>(`/video-metadata?${params}`);
      setVideos(data);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [filterAccount, filterProduct, filterMonth]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const filtered = videos.filter(v => {
    if (filterStyle && v.video_style_id?.toString() !== filterStyle) return false;
    if (search) {
      const q = search.toLowerCase();
      const prod = v.product_id ? productsMap[v.product_id]?.toLowerCase() ?? '' : '';
      const style = v.video_style_id ? stylesMap[v.video_style_id]?.toLowerCase() ?? '' : '';
      if (!prod.includes(q) && !style.includes(q)) return false;
    }
    return true;
  });

  const handleUpdate = (updated: VideoMeta) => {
    setVideos(prev => prev.map(v => v.id === updated.id ? updated : v));
    setSelected(updated);
  };

  const handleDelete = (id: number) => {
    setVideos(prev => prev.filter(v => v.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  return (
    <>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <FilterSelect
          value={filterAccount}
          onChange={setFilterAccount}
          options={accounts.map(a => ({ value: a.id.toString(), label: a.name }))}
          placeholder="All Accounts"
        />
        <FilterSelect
          value={filterProduct}
          onChange={setFilterProduct}
          options={products.map(p => ({ value: p.id.toString(), label: p.name }))}
          placeholder="All Products"
        />
        <FilterSelect
          value={filterStyle}
          onChange={setFilterStyle}
          options={styles.map(s => ({ value: s.id.toString(), label: s.name }))}
          placeholder="All Styles"
        />
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9,
            padding: '7px 11px', fontSize: 12.5, color: 'var(--text)',
            fontFamily: 'var(--font-body)', cursor: 'pointer',
          }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, aspectRatio: '9/16' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <Film size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div>No videos found</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {filtered.map(video => {
            const productName = video.product_id ? productsMap[video.product_id] : undefined;
            const styleName = video.video_style_id ? stylesMap[video.video_style_id] : undefined;
            const accountName = video.account_id ? accountsMap[video.account_id] : undefined;

            return (
              <div
                key={video.id}
                onClick={() => setSelected(video)}
                style={{
                  background: '#1a1a1a',
                  border: selected?.id === video.id ? '1.5px solid #a855f7' : '1px solid #2a2a2a',
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                {/* Thumbnail */}
                <div style={{ aspectRatio: '9/16', background: '#111', position: 'relative', overflow: 'hidden' }}>
                  {video.thumbnail_path ? (
                    <img src={video.thumbnail_path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={20} color="#2a2a2a" />
                    </div>
                  )}
                  {productName && (
                    <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(0,0,0,0.75)', borderRadius: 5, padding: '2px 6px', fontSize: 9.5, color: '#fff', fontWeight: 600, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {productName}
                    </div>
                  )}
                  {styleName && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(168,85,247,0.75)', borderRadius: 5, padding: '2px 6px', fontSize: 9.5, color: '#fff', fontWeight: 600 }}>
                      {styleName}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div style={{ padding: '8px 10px' }}>
                  <div style={{ fontSize: 11, color: accountName ? 'var(--text-secondary)' : 'var(--text-muted)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {accountName ?? 'Unassigned'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{formatDate(video.created_at)}</span>
                    {video.duration_seconds != null && (
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>· {video.duration_seconds}s</span>
                    )}
                  </div>
                  {video.notes && (
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {video.notes.slice(0, 50)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <VideoDetailPanel
          video={selected}
          accounts={accounts}
          productsMap={productsMap}
          stylesMap={stylesMap}
          accountsMap={accountsMap}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}

// ── Avatars Tab ───────────────────────────────────────────────────────────────

function AvatarsTab({ accounts }: { accounts: Account[] }) {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Avatar>>({});
  const accountsMap: Record<number, string> = {};
  accounts.forEach(a => { accountsMap[a.id] = a.name; });

  useEffect(() => {
    api.get<Avatar[]>('/avatars')
      .then(setAvatars)
      .catch(() => setAvatars([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = avatars.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || (a.style_tags ?? '').toLowerCase().includes(q);
  });

  const startEdit = (avatar: Avatar) => {
    setEditingId(avatar.id);
    setEditForm({ name: avatar.name, style_tags: avatar.style_tags ?? '', elevenlabs_voice_id: avatar.elevenlabs_voice_id ?? '', voice_label: avatar.voice_label ?? '', account_id: avatar.account_id ?? undefined });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await api.put<Avatar>(`/avatars/${editingId}`, editForm);
      setAvatars(prev => prev.map(a => a.id === editingId ? updated : a));
    } catch { }
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this avatar?')) return;
    try {
      await api.del(`/avatars/${id}`);
      setAvatars(prev => prev.filter(a => a.id !== id));
    } catch { }
  };

  return (
    <>
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, aspectRatio: '1/1' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎭</div>
          <div style={{ marginBottom: 16 }}>No avatars yet</div>
          <a href="/new-video/top-of-funnel" style={{ padding: '9px 18px', borderRadius: 10, background: 'linear-gradient(to right, #9333ea, #db2777)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
            Generate an Avatar
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {filtered.map(avatar => (
            <div
              key={avatar.id}
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, overflow: 'hidden', position: 'relative' }}
              className="avatar-card"
            >
              <style>{`.avatar-card:hover .avatar-actions { opacity: 1; }`}</style>
              <div style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
                <img
                  src={avatar.image_path}
                  alt={avatar.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              {/* Hover actions */}
              <div
                className="avatar-actions"
                style={{
                  position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4,
                  opacity: 0, transition: 'opacity 0.15s',
                }}
              >
                <button
                  onClick={() => startEdit(avatar)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.7)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => handleDelete(avatar.id)}
                  style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(248,113,113,0.8)', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{avatar.name}</div>
                {avatar.style_tags && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                    {avatar.style_tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                      <span key={tag} style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 5, background: 'rgba(168,85,247,0.15)', color: '#a855f7', fontWeight: 500 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {avatar.account_id && accountsMap[avatar.account_id] && (
                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 5, background: '#2a2a2a', color: 'var(--text-muted)' }}>
                    {accountsMap[avatar.account_id]}
                  </span>
                )}
                {avatar.voice_label && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>🎙 {avatar.voice_label}</div>
                )}
              </div>

              {/* Edit modal */}
              {editingId === avatar.id && (
                <div style={{
                  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 18, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
                    <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Edit Avatar</h3>
                    {([
                      { label: 'Name', key: 'name', placeholder: 'Avatar name' },
                      { label: 'Style Tags (comma-separated)', key: 'style_tags', placeholder: 'e.g. natural, street, bold' },
                      { label: 'ElevenLabs Voice ID', key: 'elevenlabs_voice_id', placeholder: 'voice_...' },
                      { label: 'Voice Label', key: 'voice_label', placeholder: 'e.g. Sarah - conversational' },
                    ] as { label: string; key: keyof Avatar; placeholder: string }[]).map(field => (
                      <div key={field.key} style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{field.label}</label>
                        <input
                          value={(editForm[field.key] as string) ?? ''}
                          onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}
                          placeholder={field.placeholder}
                          style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }}
                        />
                      </div>
                    ))}
                    <div style={{ marginBottom: 14 }}>
                      <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Account</label>
                      <select
                        value={editForm.account_id?.toString() ?? ''}
                        onChange={e => setEditForm(f => ({ ...f, account_id: e.target.value ? parseInt(e.target.value) : undefined }))}
                        style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)' }}
                      >
                        <option value="">No account</option>
                        {accounts.map(a => <option key={a.id} value={a.id.toString()}>{a.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '9px', borderRadius: 9, background: '#2a2a2a', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                      <button onClick={saveEdit} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'linear-gradient(to right, #9333ea, #db2777)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Scripts Tab ───────────────────────────────────────────────────────────────

function ScriptsTab({ products, styles }: { products: Product[]; styles: VideoStyle[] }) {
  const navigate = useNavigate();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ title: string; script_text: string; performance_notes: string }>({ title: '', script_text: '', performance_notes: '' });

  const productsMap: Record<number, string> = {};
  products.forEach(p => { productsMap[p.id] = p.name; });
  const stylesMap: Record<number, string> = {};
  styles.forEach(s => { stylesMap[s.id] = s.name; });

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProduct) params.set('product_id', filterProduct);
      const data = await api.get<Script[]>(`/scripts?${params}`);
      setScripts(data);
    } catch { setScripts([]); }
    finally { setLoading(false); }
  }, [filterProduct]);

  useEffect(() => { fetchScripts(); }, [fetchScripts]);

  const startEdit = (s: Script) => {
    setEditingId(s.id);
    setEditForm({ title: s.title ?? '', script_text: s.script_text, performance_notes: s.performance_notes ?? '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const updated = await api.put<Script>(`/scripts/${editingId}`, editForm);
      setScripts(prev => prev.map(s => s.id === editingId ? updated : s));
    } catch { }
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this script?')) return;
    await api.del(`/scripts/${id}`).catch(() => {});
    setScripts(prev => prev.filter(s => s.id !== id));
  };

  const useAsTemplate = (s: Script) => {
    navigate(`/new-video/top-of-funnel?script_id=${s.id}`);
  };

  return (
    <>
      <div style={{ marginBottom: 14 }}>
        <FilterSelect
          value={filterProduct}
          onChange={setFilterProduct}
          options={products.map(p => ({ value: p.id.toString(), label: p.name }))}
          placeholder="All Products"
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 100, background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14 }} />
          ))}
        </div>
      ) : scripts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📝</div>
          <div>No saved scripts</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {scripts.map(s => {
            const title = s.title || `Untitled Script ${formatDate(s.created_at)}`;
            return (
              <div key={s.id} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      {s.product_id && productsMap[s.product_id] && (
                        <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: 'rgba(168,85,247,0.15)', color: '#a855f7', fontWeight: 500 }}>
                          {productsMap[s.product_id]}
                        </span>
                      )}
                      {s.video_style_id && stylesMap[s.video_style_id] && (
                        <span style={{ fontSize: 10.5, padding: '2px 7px', borderRadius: 5, background: '#2a2a2a', color: 'var(--text-muted)' }}>
                          {stylesMap[s.video_style_id]}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 4 }}>
                      {s.script_text.slice(0, 100)}{s.script_text.length > 100 ? '…' : ''}
                    </div>
                    {s.performance_notes && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', borderLeft: '2px solid #2a2a2a', paddingLeft: 8 }}>
                        {s.performance_notes.slice(0, 80)}…
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{formatDate(s.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => useAsTemplate(s)}
                      style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7', cursor: 'pointer' }}
                    >
                      Use Template
                    </button>
                    <button
                      onClick={() => startEdit(s)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: '#2a2a2a', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Script Modal */}
      {editingId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 18, padding: 24, width: 520, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.7)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Edit Script</h3>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Title</label>
              <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Script title" style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Script Text</label>
              <textarea value={editForm.script_text} onChange={e => setEditForm(f => ({ ...f, script_text: e.target.value }))} style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 160, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Performance Notes</label>
              <textarea value={editForm.performance_notes} onChange={e => setEditForm(f => ({ ...f, performance_notes: e.target.value }))} placeholder="e.g. Strong performer, 45k views avg. Hook in clip 1 works well." style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '9px', borderRadius: 9, background: '#2a2a2a', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button onClick={saveEdit} style={{ flex: 1, padding: '9px', borderRadius: 9, background: 'linear-gradient(to right, #9333ea, #db2777)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Library Page ──────────────────────────────────────────────────────────────

type Tab = 'videos' | 'avatars' | 'scripts';

export function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get('tab') as Tab) || 'videos';
  const [tab, setTab] = useState<Tab>(tabParam);
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [styles, setStyles] = useState<VideoStyle[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api.get<Account[]>('/accounts'),
      api.get<Product[]>('/products'),
      api.get<VideoStyle[]>('/video-styles'),
    ]).then(([accs, prods, stls]) => {
      if (accs.status === 'fulfilled') setAccounts(accs.value);
      if (prods.status === 'fulfilled') setProducts(prods.value);
      if (stls.status === 'fulfilled') setStyles(stls.value);
    });
  }, []);

  const changeTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t });
    setSearch('');
  };

  return (
    <div style={{ padding: '28px 28px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.03em' }}>Library</h1>
      </div>

      {/* Tab bar + search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2a2a2a', marginBottom: 20, gap: 12 }}>
        <div style={{ display: 'flex', gap: 2 }}>
          <TabBtn active={tab === 'videos'} onClick={() => changeTab('videos')}>Videos</TabBtn>
          <TabBtn active={tab === 'avatars'} onClick={() => changeTab('avatars')}>Avatars</TabBtn>
          <TabBtn active={tab === 'scripts'} onClick={() => changeTab('scripts')}>Scripts</TabBtn>
        </div>
        <div style={{ position: 'relative', marginBottom: 1 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${tab}…`}
            style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9,
              padding: '7px 11px 7px 28px', fontSize: 12.5, color: 'var(--text)',
              fontFamily: 'var(--font-body)', width: 220,
            }}
          />
        </div>
      </div>

      {tab === 'videos' && <VideosTab accounts={accounts} products={products} styles={styles} />}
      {tab === 'avatars' && <AvatarsTab accounts={accounts} />}
      {tab === 'scripts' && <ScriptsTab products={products} styles={styles} />}
    </div>
  );
}
