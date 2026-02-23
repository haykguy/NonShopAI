import { useEffect, useState } from 'react';
import { Loader2, ChevronRight, UserCircle2, Plus, ExternalLink } from 'lucide-react';
import type { Avatar, RenderMode } from './index';

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_AVATARS: Avatar[] = [
  {
    id: 'av-1',
    name: 'Sarah — Wellness Expert',
    style_tags: ['Professional', 'Warm', 'Studio'],
    voice_label: 'EL_Bella',
    account_id: 'acc_main',
  },
  {
    id: 'av-2',
    name: 'Marcus — Street',
    style_tags: ['Casual', 'Urban', 'Authentic'],
  },
  {
    id: 'av-3',
    name: 'Elena — Stage',
    style_tags: ['Authoritative', 'Confident', 'Stage'],
    voice_label: 'EL_Rachel',
  },
];

const GENDER_OPTIONS = ['Any', 'Female', 'Male'];
const AGE_OPTIONS = ["20s", "30s", "40s", "50s", "60s+"];
const SETTING_OPTIONS = [
  'Urban street',
  'Medical clinic',
  'Wellness studio',
  'Stage/auditorium',
  'Home/bathroom',
  'Nature/outdoor',
];

// ── Placeholder silhouette ────────────────────────────────────────────────────

function AvatarPlaceholder({ size = 80 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.18,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(236,72,153,0.08))',
        border: '1px solid rgba(168,85,247,0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <UserCircle2 size={size * 0.5} color="rgba(168,85,247,0.5)" strokeWidth={1.2} />
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  selected: Avatar | null;
  renderMode: RenderMode;
  onSelect: (avatar: Avatar) => void;
  onContinue: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Step4Avatar({ selected, renderMode, onSelect, onContinue }: Props) {
  const [activeTab, setActiveTab] = useState<'library' | 'generate'>('library');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Generate form state
  const [description, setDescription] = useState('');
  const [gender, setGender] = useState('Any');
  const [ageRange, setAgeRange] = useState('30s');
  const [setting, setSetting] = useState('Urban street');
  const [saveName, setSaveName] = useState('');
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const [voiceId, setVoiceId] = useState('');
  const [voiceLabel, setVoiceLabel] = useState('');
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Fetch library
  useEffect(() => {
    fetch('/api/avatars')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : (d.avatars || d.data || []);
        setAvatars(list.length > 0 ? list : MOCK_AVATARS);
      })
      .catch(() => setAvatars(MOCK_AVATARS))
      .finally(() => setLoadingAvatars(false));
  }, []);

  // Generate avatar images
  async function handleGenerateAvatar() {
    const prompt = [
      description || 'Confident person',
      gender !== 'Any' ? gender : '',
      `in their ${ageRange}`,
      `in a ${setting}`,
      'photorealistic, professional quality',
    ]
      .filter(Boolean)
      .join(', ');

    setIsGenerating(true);
    setGeneratedImages([]);
    setSelectedImageIdx(null);
    setGenerationError(null);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: 4 }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      console.log('[Avatar Generation] Response:', data);

      // Extract image URLs from response
      const imgs: string[] = Array.isArray(data.images)
        ? data.images.map((img: any) => {
            // Handle different response formats
            if (typeof img === 'string') return img;
            if (img.url) return img.url;
            if (img.fifeUrl) return img.fifeUrl;
            return '';
          }).filter(Boolean)
        : [];

      console.log('[Avatar Generation] Extracted images:', imgs.length);

      if (imgs.length === 0) {
        setGenerationError('No images were generated. This might be a temporary issue. Please try again.');
        setGeneratedImages(['', '', '', '']);
      } else {
        setGeneratedImages(imgs);
        setGenerationError(null);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate images';
      console.error('[Avatar Generation] Error:', errorMsg);
      setGenerationError(errorMsg);
      setGeneratedImages(['', '', '', '']);
    } finally {
      setIsGenerating(false);
    }
  }

  // Save selected image as avatar
  async function handleSaveAvatar() {
    if (selectedImageIdx === null) return;
    const imageUrl = generatedImages[selectedImageIdx];
    const newAvatar: Avatar = {
      id: `av-gen-${Date.now()}`,
      name: saveName || `Generated Avatar`,
      image_url: imageUrl || undefined,
      style_tags: [gender !== 'Any' ? gender : 'Any', ageRange, setting].filter(Boolean),
      voice_label: voiceLabel || undefined,
      voice_id: voiceId || undefined,
    };

    if (saveToLibrary) {
      try {
        await fetch('/api/avatars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAvatar),
        });
      } catch {
        // ignore
      }
    }

    onSelect(newAvatar);
    setAvatars(prev => [newAvatar, ...prev]);
    setActiveTab('library');
  }

  const selectInput = (label: string, value: string, onChange: (v: string) => void, options: string[]) => (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '9px 12px',
          background: 'rgba(0,0,0,0.28)',
          border: '1px solid var(--border)',
          borderRadius: 9,
          color: 'var(--text)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.01em' }}>
          Choose an Avatar
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Pick or generate the person who will appear in your video.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
        {(['library', 'generate'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              all: 'unset',
              padding: '7px 18px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: activeTab === tab ? 600 : 400,
              fontFamily: 'var(--font-body)',
              color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
              background: activeTab === tab ? 'linear-gradient(135deg, #a855f7, #ec4899)' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(168,85,247,0.35)' : 'none',
            }}
          >
            {tab === 'library' ? 'My Library' : 'Generate New'}
          </button>
        ))}
      </div>

      {/* ── MY LIBRARY TAB ── */}
      {activeTab === 'library' && (
        <div>
          {loadingAvatars ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-muted)', padding: '40px 0' }}>
              <Loader2 size={18} className="animate-spin" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14 }}>Loading avatars…</span>
            </div>
          ) : avatars.length === 0 ? (
            <div style={{ padding: '48px 28px', textAlign: 'center' }}>
              <UserCircle2 size={48} color="var(--text-dim)" strokeWidth={1.2} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>
                No avatars yet
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
                Generate your first avatar to start building your library.
              </p>
              <button
                onClick={() => setActiveTab('generate')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-body)',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
                Generate Your First Avatar
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
              {avatars.map(avatar => {
                const isSelected = selected?.id === avatar.id;
                const isHovered = hoveredId === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => onSelect(avatar)}
                    onMouseEnter={() => setHoveredId(avatar.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      all: 'unset',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '20px 16px',
                      background: isSelected ? 'rgba(168,85,247,0.10)' : isHovered ? 'rgba(255,255,255,0.03)' : 'var(--card)',
                      border: `1px solid ${isSelected ? '#a855f7' : isHovered ? 'rgba(168,85,247,0.30)' : 'var(--border)'}`,
                      borderRadius: 16,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      transform: isHovered && !isSelected ? 'translateY(-2px)' : 'none',
                      boxShadow: isSelected ? '0 0 0 1px rgba(168,85,247,0.3), 0 6px 24px rgba(168,85,247,0.12)' : 'none',
                      textAlign: 'center',
                      gap: 12,
                      position: 'relative',
                    }}
                  >
                    {/* Selected indicator */}
                    {isSelected && (
                      <div style={{ position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: 12 }}>✓</span>
                      </div>
                    )}

                    {/* Avatar image or placeholder */}
                    {avatar.image_url ? (
                      <img
                        src={avatar.image_url}
                        alt={avatar.name}
                        style={{ width: 80, height: 80, borderRadius: 14, objectFit: 'cover', border: `2px solid ${isSelected ? '#a855f7' : 'var(--border)'}` }}
                      />
                    ) : (
                      <AvatarPlaceholder size={80} />
                    )}

                    {/* Name */}
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-body)', lineHeight: 1.4 }}>
                      {avatar.name}
                    </div>

                    {/* Style tags */}
                    {avatar.style_tags && avatar.style_tags.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                        {avatar.style_tags.map(tag => (
                          <span key={tag} style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 500, fontFamily: 'var(--font-mono)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Voice (only when heygen mode) */}
                    {renderMode === 'heygen-11labs' && avatar.voice_label && (
                      <div style={{ fontSize: 11, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>
                        🎙 {avatar.voice_label}
                      </div>
                    )}

                    {/* Account badge */}
                    {avatar.account_id && (
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                        {avatar.account_id}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── GENERATE NEW TAB ── */}
      {activeTab === 'generate' && (
        <div>
          {/* Description */}
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Describe this avatar
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g. Confident Asian woman in her 40s, wearing a blazer, standing on a city street, professional but approachable"
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '12px 14px',
              color: 'var(--text)',
              fontFamily: 'var(--font-body)',
              fontSize: 13.5,
              lineHeight: 1.65,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 20,
              transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />

          {/* Row of selects */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            {selectInput('Gender', gender, setGender, GENDER_OPTIONS)}
            {selectInput('Age Range', ageRange, setAgeRange, AGE_OPTIONS)}
            {selectInput('Setting', setting, setSetting, SETTING_OPTIONS)}
          </div>

          {/* Save name + toggle */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Save as Name
              </label>
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. Sarah — Wellness Expert"
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  background: 'rgba(0,0,0,0.28)',
                  border: '1px solid var(--border)',
                  borderRadius: 9,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Save to library toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
              <button
                onClick={() => setSaveToLibrary(v => !v)}
                style={{
                  all: 'unset',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-body)',
                  whiteSpace: 'nowrap',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 22,
                    borderRadius: 11,
                    background: saveToLibrary ? '#a855f7' : 'rgba(255,255,255,0.10)',
                    border: `1px solid ${saveToLibrary ? '#a855f7' : 'var(--border)'}`,
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: saveToLibrary ? 18 : 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  />
                </div>
                Save to library
              </button>
            </div>
          </div>

          {/* Voice section (HeyGen mode only) */}
          {renderMode === 'heygen-11labs' && (
            <div
              style={{
                padding: '20px 22px',
                background: 'rgba(168,85,247,0.06)',
                border: '1px solid rgba(168,85,247,0.20)',
                borderRadius: 14,
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#a855f7', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
                Match a Voice
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    ElevenLabs Voice ID
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={voiceId}
                      onChange={e => setVoiceId(e.target.value)}
                      placeholder="e.g. EXAVITQu4vr4xnSDxMaL"
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        background: 'rgba(0,0,0,0.28)',
                        border: '1px solid var(--border)',
                        borderRadius: 9,
                        color: 'var(--text)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 12,
                        outline: 'none',
                        transition: 'border-color 0.15s',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    />
                    <a
                      href="https://elevenlabs.io/voice-library"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        padding: '9px 14px',
                        background: 'rgba(168,85,247,0.12)',
                        border: '1px solid rgba(168,85,247,0.30)',
                        borderRadius: 9,
                        color: '#a855f7',
                        textDecoration: 'none',
                        fontSize: 12,
                        fontWeight: 500,
                        fontFamily: 'var(--font-body)',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                      }}
                    >
                      <ExternalLink size={12} strokeWidth={2} />
                      Browse voices
                    </a>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                    Voice Label
                  </label>
                  <input
                    value={voiceLabel}
                    onChange={e => setVoiceLabel(e.target.value)}
                    placeholder="e.g. EL_Bella"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      background: 'rgba(0,0,0,0.28)',
                      border: '1px solid var(--border)',
                      borderRadius: 9,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {generationError && (
            <div
              style={{
                padding: '12px 16px',
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.30)',
                borderRadius: 10,
                fontSize: 13,
                color: '#ef4444',
                fontFamily: 'var(--font-body)',
                marginBottom: 16,
              }}
            >
              {generationError}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerateAvatar}
            disabled={isGenerating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 26px',
              background: isGenerating ? 'rgba(168,85,247,0.18)' : 'linear-gradient(135deg, #a855f7, #ec4899)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.8 : 1,
              transition: 'all 0.15s',
              boxShadow: !isGenerating ? '0 4px 18px rgba(168,85,247,0.35)' : 'none',
              marginBottom: 28,
            }}
          >
            {isGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} strokeWidth={2.5} />
            )}
            {isGenerating ? 'Generating…' : 'Generate Avatar'}
          </button>

          {/* Image result grid */}
          {generatedImages.length > 0 && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                Pick One
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {generatedImages.map((imgUrl, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImageIdx(i)}
                    style={{
                      all: 'unset',
                      display: 'block',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: `2px solid ${selectedImageIdx === i ? '#a855f7' : 'var(--border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                      boxShadow: selectedImageIdx === i ? '0 0 0 2px rgba(168,85,247,0.3)' : 'none',
                      position: 'relative',
                      aspectRatio: '1',
                    }}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={`Option ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', paddingBottom: '100%', background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(236,72,153,0.07))', position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UserCircle2 size={40} color="rgba(168,85,247,0.4)" strokeWidth={1.2} />
                        </div>
                      </div>
                    )}
                    {selectedImageIdx === i && (
                      <div style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: '#fff', fontSize: 12 }}>✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {selectedImageIdx !== null && (
                <button
                  onClick={handleSaveAvatar}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 22px',
                    background: 'rgba(52,211,153,0.14)',
                    color: '#34d399',
                    border: '1px solid rgba(52,211,153,0.35)',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-body)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Use this Avatar {saveToLibrary ? '& Save to Library' : ''}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Continue */}
      {selected && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
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
