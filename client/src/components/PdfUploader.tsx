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
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
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
    <div className="space-y-3">
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          Drop a PDF script here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Supports scripts with CLIP/Scene sections containing IMAGE PROMPT and VIDEO PROMPT
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">{selectedFile.name}</span>
            <span className="text-xs text-gray-400">
              ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="px-4 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Parsing...' : 'Parse PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
