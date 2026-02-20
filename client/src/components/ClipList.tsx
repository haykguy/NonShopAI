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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Clip Prompts ({clips.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleAiPanel}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              aiPanelOpen
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            AI Assistant
          </button>
          <button
            type="button"
            onClick={addClip}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
          >
            <Plus className="w-4 h-4" />
            Add Clip
          </button>
        </div>
      </div>

      <PdfUploader onUpload={onParsePdf} loading={loading} />

      <div className="mt-4 space-y-3">
        {clips.map((clip, i) => (
          <div key={i} className="relative group">
            <ClipEditor index={i} clip={clip} onChange={c => updateClip(i, c)} />
            {clips.length > 1 && (
              <button
                type="button"
                onClick={() => removeClip(i)}
                className="absolute top-3 right-12 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
