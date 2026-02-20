import { useState } from 'react';
import type { Project } from '../types';
import { Settings, Plus, Minus } from 'lucide-react';

interface Props {
  onCreateProject: (name: string, clipCount: number, settings: any) => Promise<Project>;
  loading: boolean;
}

export function ProjectSetup({ onCreateProject, loading }: Props) {
  const [name, setName] = useState('');
  const [clipCount, setClipCount] = useState(7);
  const [autoPickImage, setAutoPickImage] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateProject(name || `Video ${new Date().toLocaleDateString()}`, clipCount, {
      autoPickImage,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          New Project
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Layout settings (borders, text, aspect ratio) are configured in the visual mockup on the next screen.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Video Project"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Clips: {clipCount}
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setClipCount(Math.max(1, clipCount - 1))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={1}
                max={20}
                value={clipCount}
                onChange={e => setClipCount(parseInt(e.target.value))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => setClipCount(Math.min(20, clipCount + 1))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image Selection</label>
            <select
              value={autoPickImage ? 'auto' : 'review'}
              onChange={e => setAutoPickImage(e.target.value === 'auto')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            >
              <option value="auto">Auto-pick first image (faster)</option>
              <option value="review">Generate 4 images, let me choose</option>
            </select>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creating...' : 'Create Project'}
      </button>
    </form>
  );
}
