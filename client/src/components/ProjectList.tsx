import { useEffect, useState } from 'react';
import { FolderOpen, Trash2, Clock, CheckCircle2, Loader2, AlertCircle, Film } from 'lucide-react';

interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  clipCount: number;
  completedClips: number;
}

interface Props {
  currentProjectId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => Promise<ProjectSummary[]>;
}

const statusIcons: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  draft: { icon: Clock, color: 'text-gray-400', label: 'Draft' },
  generating: { icon: Loader2, color: 'text-purple-500', label: 'Generating' },
  compiling: { icon: Loader2, color: 'text-blue-500', label: 'Compiling' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: 'Completed' },
  error: { icon: AlertCircle, color: 'text-red-500', label: 'Error' },
};

export function ProjectList({ currentProjectId, onSelect, onDelete, onRefresh }: Props) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const list = await onRefresh();
    setProjects(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    await onDelete(id);
    refresh();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading projects...</span>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FolderOpen className="w-5 h-5 text-purple-600" />
        Your Projects ({projects.length})
      </h2>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {projects.map(p => {
          const cfg = statusIcons[p.status] || statusIcons.draft;
          const Icon = cfg.icon;
          const isActive = p.id === currentProjectId;
          const isAnimated = p.status === 'generating' || p.status === 'compiling';

          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors group ${
                isActive
                  ? 'bg-purple-50 border border-purple-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${cfg.color} ${isAnimated ? 'animate-spin' : ''}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{p.name}</span>
                  <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>{p.clipCount} clips</span>
                  {p.completedClips > 0 && (
                    <span className="text-green-500">{p.completedClips} done</span>
                  )}
                  <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              {p.status === 'completed' && p.completedClips > 0 && (
                <Film className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
              <button
                onClick={(e) => handleDelete(e, p.id, p.name)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-opacity flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
