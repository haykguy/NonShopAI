import { Download, Film } from 'lucide-react';

interface Props {
  projectId: string;
  finalVideoPath?: string;
  onCompile: () => Promise<any>;
  loading: boolean;
  completedClipCount: number;
}

export function VideoPreview({ projectId, finalVideoPath, onCompile, loading, completedClipCount }: Props) {
  const downloadUrl = `/api/projects/${projectId}/download`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Film className="w-5 h-5 text-purple-600" />
        Final Video
      </h2>

      {!finalVideoPath ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            {completedClipCount > 0
              ? `${completedClipCount} clip(s) ready to compile`
              : 'No completed clips yet'}
          </p>
          <button
            onClick={() => onCompile()}
            disabled={loading || completedClipCount === 0}
            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Compiling...' : 'Compile Final Video'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <video
            src={downloadUrl}
            controls
            className="w-full max-h-[500px] rounded-lg bg-black"
          />
          <div className="flex gap-3">
            <a
              href={downloadUrl}
              download
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Video
            </a>
            <button
              onClick={() => onCompile()}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Recompiling...' : 'Recompile'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
