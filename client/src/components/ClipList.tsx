import { ClipEditor } from './ClipEditor';
import { PdfUploader } from './PdfUploader';
import { FileText, Plus, Trash2, Wand2 } from 'lucide-react';

interface ClipData {
  imagePrompt: string;
  videoPrompt: string;
}

interface Props {
  clips: ClipData[];
  onChange: (clips: ClipData[]) => void;
  onParsePdf: (file: File) => Promise<any>;
  loading: boolean;
  onToggleAiPanel: () => void;
  aiPanelOpen: boolean;
}

export function ClipList({ clips, onChange, onParsePdf, loading, onToggleAiPanel, aiPanelOpen }: Props) {
  const updateClip = (index: number, clip: ClipData) => {
    const updated = [...clips];
    updated[index] = clip;
    onChange(updated);
  };

  const addClip = () => {
    onChange([...clips, { imagePrompt: '', videoPrompt: '' }]);
  };

  const removeClip = (index: number) => {
    if (clips.length <= 1) return;
    onChange(clips.filter((_, i) => i !== index));
  };

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
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--separator)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color="var(--gold)" strokeWidth={2} />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 15,
              color: 'var(--text)',
              letterSpacing: '-0.015em',
            }}
          >
            Clip Prompts
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--glass-bg-heavy)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '1px 8px',
            }}
          >
            {clips.length}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={onToggleAiPanel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: `1px solid ${aiPanelOpen ? 'rgba(245,166,35,0.35)' : 'var(--border)'}`,
              background: aiPanelOpen ? 'var(--gold-dim)' : 'var(--glass-bg)',
              color: aiPanelOpen ? 'var(--gold)' : 'var(--text-secondary)',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (!aiPanelOpen) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
              }
            }}
            onMouseLeave={e => {
              if (!aiPanelOpen) {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }
            }}
          >
            <Wand2 size={13} strokeWidth={2} />
            AI Assistant
          </button>
          <button
            type="button"
            onClick={addClip}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--glass-bg)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Add Clip
          </button>
        </div>
      </div>

      {/* PDF uploader */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--separator)' }}>
        <PdfUploader onUpload={onParsePdf} loading={loading} />
      </div>

      {/* Clip list */}
      <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clips.map((clip, i) => (
          <div key={i} style={{ position: 'relative' }} className="group">
            <ClipEditor index={i} clip={clip} onChange={c => updateClip(i, c)} />
            {clips.length > 1 && (
              <button
                type="button"
                onClick={() => removeClip(i)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 44,
                  width: 26,
                  height: 26,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--error-dim)',
                  border: '1px solid rgba(255,69,58,0.2)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--error)',
                  opacity: 0,
                  transition: 'opacity 0.15s',
                }}
                className="group-hover-show"
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0'; }}
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
