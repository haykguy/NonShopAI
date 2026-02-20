import type { Clip } from '../types';
import { ImageIcon, Check } from 'lucide-react';

interface Props {
  clip: Clip;
  onSelect: (clipIndex: number, imageIndex: number) => void;
}

export function ImageReview({ clip, onSelect }: Props) {
  if (!clip.generatedImages || clip.generatedImages.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-yellow-600" />
        Select Image for Clip {clip.index + 1}
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose one of the generated images to use as the video start frame:
      </p>
      <p className="text-xs text-gray-500 mb-3 italic">
        "{clip.imagePrompt.substring(0, 100)}{clip.imagePrompt.length > 100 ? '...' : ''}"
      </p>

      <div className="grid grid-cols-2 gap-3">
        {clip.generatedImages.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(clip.index, i)}
            className="group relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all"
          >
            <img
              src={img.fifeUrl}
              alt={`Option ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 bg-white rounded-full p-2 shadow-lg transition-opacity">
                <Check className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              #{i + 1}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
