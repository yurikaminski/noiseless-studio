import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Loader2, Play, RefreshCw, ImageIcon, Video } from 'lucide-react';
import { apiFetch } from '../lib/api';

interface Scene {
  id: number;
  project_id: number;
  row_index: number;
  time?: string;
  script?: string;
  voice_over?: string;
  frame_a_prompt?: string;
  frame_b_prompt?: string;
  video_prompt?: string;
  status: 'Criar imagem' | 'Criar vídeo' | 'Fazer nada';
  drive_link?: string;
  processing_status: 'idle' | 'processing' | 'done' | 'error';
  error_message?: string;
}

interface SceneTableProps {
  projectId: number;
}

export function SceneTable({ projectId }: SceneTableProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressMessages, setProgressMessages] = useState<Record<number, string>>({});
  const sseRef = useRef<EventSource | null>(null);

  const loadScenes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/projects/${projectId}/scenes`);
      const data = await res.json();
      setScenes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScenes();

    const sse = new EventSource(`/api/events/${projectId}`);
    sseRef.current = sse;

    sse.addEventListener('progress', (e: MessageEvent) => {
      const { sceneId, message } = JSON.parse(e.data);
      setProgressMessages(prev => ({ ...prev, [sceneId]: message }));
    });

    sse.addEventListener('scene_update', (e: MessageEvent) => {
      const updated: Scene = JSON.parse(e.data);
      setScenes(prev => prev.map(s => s.id === updated.id ? updated : s));
      if (updated.processing_status !== 'processing') {
        setProgressMessages(prev => {
          const n = { ...prev };
          delete n[updated.id];
          return n;
        });
      }
    });

    return () => {
      sse.close();
    };
  }, [projectId]);

  const processScene = async (sceneId: number) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, processing_status: 'processing' } : s));
    try {
      const res = await apiFetch(`/api/scenes/${sceneId}/process`, { method: 'POST' });
      if (!res.ok) {
        const json = await res.json();
        setScenes(prev => prev.map(s =>
          s.id === sceneId ? { ...s, processing_status: 'error', error_message: json.error } : s
        ));
      }
    } catch {
      setScenes(prev => prev.map(s =>
        s.id === sceneId ? { ...s, processing_status: 'error', error_message: 'Network error' } : s
      ));
    }
  };

  const processBatch = async (statusFilter: 'Criar imagem' | 'Criar vídeo') => {
    try {
      await apiFetch(`/api/projects/${projectId}/process/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_filter: statusFilter }),
      });
      await loadScenes();
    } catch {
      // ignore
    }
  };

  const statusBadge = (scene: Scene) => {
    if (scene.processing_status === 'processing') {
      return (
        <div className="flex items-center gap-1.5 min-w-0">
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
          <span className="text-xs text-blue-400 truncate">{progressMessages[scene.id] || 'Processing...'}</span>
        </div>
      );
    }
    if (scene.processing_status === 'error') {
      return (
        <div
          className="px-2 py-0.5 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-xs cursor-help"
          title={scene.error_message}
        >
          Error
        </div>
      );
    }
    if (scene.processing_status === 'done') {
      return (
        <div className="px-2 py-0.5 rounded-md bg-green-500/20 border border-green-500/30 text-green-400 text-xs">
          Done
        </div>
      );
    }

    const badges: Record<string, { bg: string; border: string; text: string; label: string }> = {
      'Criar imagem': { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Create Image' },
      'Criar vídeo':  { bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   text: 'text-blue-400',   label: 'Create Video' },
      'Fazer nada':   { bg: 'bg-white/5',        border: 'border-white/10',      text: 'text-white/30',   label: 'Skip' },
    };
    const badge = badges[scene.status] ?? badges['Fazer nada'];
    return (
      <div className={`px-2 py-0.5 rounded-md border ${badge.bg} ${badge.border} ${badge.text} text-xs whitespace-nowrap`}>
        {badge.label}
      </div>
    );
  };

  const truncate = (text?: string, len = 60) =>
    !text ? '—' : text.length > len ? text.slice(0, len) + '…' : text;

  const imageCount = scenes.filter(s => s.status === 'Criar imagem').length;
  const videoCount = scenes.filter(s => s.status === 'Criar vídeo').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Batch Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => processBatch('Criar imagem')}
          disabled={imageCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl text-sm hover:bg-yellow-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ImageIcon className="w-4 h-4" />
          Process Images ({imageCount})
        </button>
        <button
          onClick={() => processBatch('Criar vídeo')}
          disabled={videoCount === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl text-sm hover:bg-blue-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Video className="w-4 h-4" />
          Process Videos ({videoCount})
        </button>
        <button
          onClick={loadScenes}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/70 rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium w-10">#</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium w-16">Time</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium w-40">Status</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium">Frame A</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium">Frame B</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium">Video Prompt</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium w-20">Drive</th>
                <th className="px-4 py-3 text-left text-xs text-white/40 font-medium w-20">Run</th>
              </tr>
            </thead>
            <tbody>
              {scenes.map((scene, i) => (
                <tr key={scene.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-white/30 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 text-white/60 text-xs whitespace-nowrap">{scene.time || '—'}</td>
                  <td className="px-4 py-3">{statusBadge(scene)}</td>
                  <td className="px-4 py-3 text-white/50 text-xs max-w-[180px]">
                    <span title={scene.frame_a_prompt}>{truncate(scene.frame_a_prompt)}</span>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs max-w-[180px]">
                    <span title={scene.frame_b_prompt}>{truncate(scene.frame_b_prompt)}</span>
                  </td>
                  <td className="px-4 py-3 text-white/50 text-xs max-w-[180px]">
                    <span title={scene.video_prompt}>{truncate(scene.video_prompt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {scene.drive_link ? (
                      <a
                        href={scene.drive_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open
                      </a>
                    ) : (
                      <span className="text-white/20 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => processScene(scene.id)}
                      disabled={scene.status === 'Fazer nada' || scene.processing_status === 'processing'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Play className="w-3 h-3" />
                      Run
                    </button>
                  </td>
                </tr>
              ))}
              {scenes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/30 text-sm">
                    No scenes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
