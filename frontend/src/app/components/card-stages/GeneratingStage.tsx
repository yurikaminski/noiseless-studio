import type { ElementType } from 'react';
import { Wand2, Video, Play, Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { VideoCardFull, CardScene } from '../VideoCardModal';

interface GeneratingStageProps {
  card: VideoCardFull;
  onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: ElementType }> = {
  pending:    { label: 'Pending',    color: 'text-white/40 bg-white/5 border-white/10',          icon: Clock         },
  generating: { label: 'Generating', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', icon: Loader2    },
  done:       { label: 'Done',       color: 'text-green-400 bg-green-500/10 border-green-500/20', icon: CheckCircle2  },
  error:      { label: 'Error',      color: 'text-red-400 bg-red-500/10 border-red-500/20',       icon: AlertCircle   },
};

export function GeneratingStage({ card, onUpdate }: GeneratingStageProps) {
  const scenes: CardScene[] = card.scenes || [];
  const doneCount = scenes.filter(s => s.status === 'done').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
        <div>
          <h2 className="text-xl font-light text-white">GENERATING</h2>
          {scenes.length > 0 && (
            <p className="text-xs text-white/40 mt-0.5">{doneCount} / {scenes.length} scenes done</p>
          )}
        </div>
        <button
          disabled={scenes.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 rounded-xl transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4" />
          Generate All
        </button>
      </div>

      {/* Progress bar */}
      {scenes.length > 0 && (
        <div className="px-8 py-2 bg-black/10 shrink-0">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
              style={{ width: `${(doneCount / scenes.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Table header */}
      <div className="px-8 py-3 border-b border-white/10 bg-black/10 shrink-0">
        <div className="grid gap-4 text-xs font-medium text-white/40 uppercase tracking-wider" style={{ gridTemplateColumns: '32px 1fr 120px 120px 120px 100px 160px' }}>
          <div>#</div>
          <div>Description</div>
          <div>Frame A</div>
          <div>Frame B</div>
          <div>Video</div>
          <div>Status</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Scenes */}
      <div className="flex-1 overflow-y-auto">
        {scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-8">
            <Wand2 className="w-10 h-10 text-white/20 mb-3" />
            <p className="text-white/40 text-sm mb-1">No scenes to generate yet</p>
            <p className="text-white/25 text-xs">Go to Storyboard to create scenes first</p>
          </div>
        ) : (
          scenes.map((scene, index) => {
            const cfg = statusConfig[scene.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;

            return (
              <div key={scene.id} className="px-8 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '32px 1fr 120px 120px 120px 100px 160px' }}>
                  {/* # */}
                  <span className="text-xs text-white/40">{index + 1}</span>

                  {/* Description */}
                  <p className="text-sm text-white/80 truncate">{scene.description || `Scene ${index + 1}`}</p>

                  {/* Frame A preview */}
                  <div>
                    {scene.frame_a_url ? (
                      <img src={scene.frame_a_url} alt="Frame A" className="w-full h-14 object-cover rounded-lg border border-white/10" />
                    ) : (
                      <div className="w-full h-14 bg-white/5 border border-dashed border-white/15 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-white/20">—</span>
                      </div>
                    )}
                  </div>

                  {/* Frame B preview */}
                  <div>
                    {scene.frame_b_url ? (
                      <img src={scene.frame_b_url} alt="Frame B" className="w-full h-14 object-cover rounded-lg border border-white/10" />
                    ) : (
                      <div className="w-full h-14 bg-white/5 border border-dashed border-white/15 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-white/20">—</span>
                      </div>
                    )}
                  </div>

                  {/* Video preview */}
                  <div>
                    {scene.video_url ? (
                      <video src={scene.video_url} className="w-full h-14 object-cover rounded-lg border border-white/10" />
                    ) : (
                      <div className="w-full h-14 bg-white/5 border border-dashed border-white/15 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-white/20">—</span>
                      </div>
                    )}
                  </div>

                  {/* Status badge */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cfg.color}`}>
                      <StatusIcon className={`w-3 h-3 ${scene.status === 'generating' ? 'animate-spin' : ''}`} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5">
                    <button className="w-full px-2 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1">
                      <Wand2 className="w-3 h-3" />
                      Frames
                    </button>
                    <button className="w-full px-2 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1">
                      <Video className="w-3 h-3" />
                      Scene
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
