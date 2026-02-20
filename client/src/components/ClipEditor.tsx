import { useState } from 'react';
import { Edit3, ChevronDown, ChevronUp } from 'lucide-react';

interface ClipData {
  imagePrompt: string;
  videoPrompt: string;
}

interface Props {
  index: number;
  clip: ClipData;
  onChange: (clip: ClipData) => void;
}

export function ClipEditor({ index, clip, onChange }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-purple-600" />
          <span className="font-medium text-sm">Clip {index + 1}</span>
          {clip.imagePrompt && (
            <span className="text-xs text-gray-400 truncate max-w-[200px]">
              — {clip.imagePrompt.substring(0, 40)}...
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Image Prompt
            </label>
            <textarea
              value={clip.imagePrompt}
              onChange={e => onChange({ ...clip, imagePrompt: e.target.value })}
              rows={3}
              placeholder="Describe the image to generate..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-vertical"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Video Prompt
            </label>
            <textarea
              value={clip.videoPrompt}
              onChange={e => onChange({ ...clip, videoPrompt: e.target.value })}
              rows={3}
              placeholder="Describe the video motion/action..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-vertical"
            />
          </div>
        </div>
      )}
    </div>
  );
}
