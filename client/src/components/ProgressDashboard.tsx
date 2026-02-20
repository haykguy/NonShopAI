import type { Clip, PipelineEvent } from '../types';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Image,
  Video,
  Upload,
  Download,
} from 'lucide-react';

interface Props {
  clips: Clip[];
  events: PipelineEvent[];
  progress: number;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  connected: boolean;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-gray-400', label: 'Pending' },
  generating_image: { icon: Image, color: 'text-blue-500', label: 'Generating Image' },
  reviewing_image: { icon: Image, color: 'text-yellow-500', label: 'Awaiting Review' },
  uploading_asset: { icon: Upload, color: 'text-blue-500', label: 'Uploading' },
  generating_video: { icon: Video, color: 'text-purple-500', label: 'Generating Video' },
  downloading: { icon: Download, color: 'text-blue-500', label: 'Downloading' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Failed' },
  skipped: { icon: SkipForward, color: 'text-orange-400', label: 'Skipped' },
};

export function ProgressDashboard({
  clips,
  events,
  progress,
  completedCount,
  failedCount,
  totalCount,
  connected,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Generation Progress</h2>
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-xs text-gray-500">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{completedCount} of {totalCount} clips done</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {failedCount > 0 && (
          <p className="text-xs text-red-500 mt-1">{failedCount} clip(s) failed or skipped</p>
        )}
      </div>

      {/* Clip status grid */}
      <div className="space-y-2 mb-4">
        {clips.map(clip => {
          const cfg = statusConfig[clip.status] || statusConfig.pending;
          const Icon = cfg.icon;
          const isActive = ['generating_image', 'uploading_asset', 'generating_video', 'downloading'].includes(clip.status);

          return (
            <div
              key={clip.index}
              className={`flex items-center gap-3 p-3 rounded-lg ${
                isActive ? 'bg-purple-50' : 'bg-gray-50'
              }`}
            >
              {isActive ? (
                <Loader2 className={`w-5 h-5 ${cfg.color} animate-spin`} />
              ) : (
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Clip {clip.index + 1}</span>
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {clip.imagePrompt?.substring(0, 60)}
                </p>
              </div>
              {clip.error && (
                <span className="text-xs text-red-500 max-w-[150px] truncate" title={clip.error}>
                  {clip.error}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Event log */}
      <details className="text-xs">
        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
          Event Log ({events.length} events)
        </summary>
        <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-gray-50 rounded-lg p-2 font-mono">
          {events.slice(-30).map((ev, i) => (
            <div key={i} className="text-gray-600">
              <span className="text-gray-400">
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>{' '}
              {ev.type}
              {ev.clipIndex !== undefined && ` [clip ${ev.clipIndex + 1}]`}
              {ev.data?.message && ` — ${ev.data.message}`}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
