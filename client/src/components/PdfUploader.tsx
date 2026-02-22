import { useState, useRef } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface Props {
  onUpload: (file: File) => Promise<any>;
  loading: boolean;
}

export function PdfUploader({ onUpload, loading }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    await onUpload(selectedFile);
    setSelectedFile(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--gold)' : 'var(--border-bright)'}`,
          borderRadius: 10,
          padding: '18px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background 0.2s',
          background: dragOver ? 'var(--gold-dim)' : 'transparent',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseEnter={e => {
          if (!dragOver) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--text-dim)';
        }}
        onMouseLeave={e => {
          if (!dragOver) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)';
        }}
      >
        <Upload size={20} color={dragOver ? 'var(--gold)' : 'var(--text-muted)'} strokeWidth={1.8} />
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            Drop a PDF script here, or click to browse
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: 3, lineHeight: 1.4 }}>
            Supports scripts with CLIP/Scene sections containing IMAGE PROMPT and VIDEO PROMPT
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--glass-bg-heavy)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={15} color="var(--gold)" strokeWidth={2} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-body)' }}>
              {selectedFile.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              style={{
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                cursor: 'pointer',
                color: 'var(--text-muted)',
              }}
            >
              <X size={12} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="btn-gold"
              style={{ padding: '5px 14px', fontSize: 12 }}
            >
              {loading ? 'Parsing…' : 'Parse PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
