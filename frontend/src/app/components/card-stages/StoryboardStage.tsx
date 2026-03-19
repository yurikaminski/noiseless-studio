import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Clock, Image as ImageIcon, Sparkles, Wand2, Video, Trash2 } from 'lucide-react';
import type { VideoCardFull, CardScene } from '../VideoCardModal';

interface StoryboardStageProps {
  card: VideoCardFull;
  onUpdate: () => void;
}

export function StoryboardStage({ card, onUpdate }: StoryboardStageProps) {
  const [scenes, setScenes] = useState<CardScene[]>(card.scenes || []);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [aiPrompt, setAiPrompt] = useState('');

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateSceneField = async (sceneId: number, field: string, value: string) => {
    await fetch(`/api/cards/scenes/${sceneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, [field]: value } : s));
  };

  const addScene = async () => {
    const res = await fetch(`/api/cards/${card.id}/scenes`, { method: 'POST' });
    const newScene = await res.json();
    setScenes(prev => [...prev, newScene]);
  };

  const deleteScene = async (sceneId: number) => {
    await fetch(`/api/cards/scenes/${sceneId}`, { method: 'DELETE' });
    setScenes(prev => prev.filter(s => s.id !== sceneId));
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
        <h2 className="text-xl font-light text-white">STORYBOARD</h2>
        <button
          onClick={addScene}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Scene
        </button>
      </div>

      {/* Table header */}
      <div className="px-8 py-3 border-b border-white/10 bg-black/10 shrink-0">
        <div className="grid gap-4 text-xs font-medium text-white/40 uppercase tracking-wider" style={{ gridTemplateColumns: '40px 80px 80px 1fr 140px 140px 180px' }}>
          <div />
          <div>Start</div>
          <div>End</div>
          <div>Description</div>
          <div>Frame A</div>
          <div>Frame B</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Scenes list */}
      <div className="flex-1 overflow-y-auto">
        {scenes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <p className="text-sm mb-3">No scenes yet</p>
            <button
              onClick={addScene}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/50"
            >
              <Plus className="w-4 h-4" />
              Add first scene
            </button>
          </div>
        )}

        {scenes.map((scene, index) => {
          const isExpanded = expandedIds.has(scene.id);
          return (
            <div key={scene.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              {/* Main row */}
              <div
                className="px-8 py-3 cursor-pointer"
                onClick={() => toggleExpand(scene.id)}
              >
                <div className="grid gap-4 items-center" style={{ gridTemplateColumns: '40px 80px 80px 1fr 140px 140px 180px' }}>
                  {/* Expand */}
                  <div className="flex items-center justify-center">
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-white/40" />
                      : <ChevronRight className="w-4 h-4 text-white/40" />
                    }
                  </div>

                  {/* Start time */}
                  <div className="flex items-center gap-1 text-white/60 text-sm" onClick={e => e.stopPropagation()}>
                    <Clock className="w-3 h-3 text-white/30 shrink-0" />
                    <input
                      value={scene.start_time || '00:00'}
                      onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, start_time: e.target.value } : s))}
                      onBlur={e => updateSceneField(scene.id, 'start_time', e.target.value)}
                      className="bg-transparent w-14 text-sm text-white/60 focus:outline-none focus:text-white"
                      placeholder="00:00"
                    />
                  </div>

                  {/* End time */}
                  <div className="flex items-center gap-1 text-white/60 text-sm" onClick={e => e.stopPropagation()}>
                    <Clock className="w-3 h-3 text-white/30 shrink-0" />
                    <input
                      value={scene.end_time || '00:00'}
                      onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, end_time: e.target.value } : s))}
                      onBlur={e => updateSceneField(scene.id, 'end_time', e.target.value)}
                      className="bg-transparent w-14 text-sm text-white/60 focus:outline-none focus:text-white"
                      placeholder="00:00"
                    />
                  </div>

                  {/* Description */}
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      value={scene.description || ''}
                      onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, description: e.target.value } : s))}
                      onBlur={e => updateSceneField(scene.id, 'description', e.target.value)}
                      className="w-full bg-transparent text-white/90 text-sm focus:outline-none focus:border-b focus:border-white/20 placeholder-white/30"
                      placeholder={`Scene ${index + 1}...`}
                    />
                  </div>

                  {/* Frame A */}
                  <div>
                    {scene.frame_a_url ? (
                      <img src={scene.frame_a_url} alt="Frame A" className="w-full h-16 object-cover rounded-lg border border-white/10" />
                    ) : (
                      <div className="w-full h-16 bg-white/5 border border-dashed border-white/20 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Frame B */}
                  <div>
                    {scene.frame_b_url ? (
                      <img src={scene.frame_b_url} alt="Frame B" className="w-full h-16 object-cover rounded-lg border border-white/10" />
                    ) : (
                      <div className="w-full h-16 bg-white/5 border border-dashed border-white/20 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5" onClick={e => e.stopPropagation()}>
                    <button className="w-full px-2.5 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                      <Wand2 className="w-3 h-3" />
                      Frames
                    </button>
                    <button className="w-full px-2.5 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                      <Video className="w-3 h-3" />
                      Scene
                    </button>
                    <button
                      onClick={() => deleteScene(scene.id)}
                      className="w-full px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-8 pb-6 pt-2 bg-white/[0.02]">
                  <div className="ml-10 grid grid-cols-2 gap-6">
                    {/* Narration */}
                    <div>
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Narration</label>
                      <textarea
                        value={scene.narration || ''}
                        onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, narration: e.target.value } : s))}
                        onBlur={e => updateSceneField(scene.id, 'narration', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 resize-none"
                        rows={3}
                        placeholder="Voice-over or dialogue..."
                      />
                    </div>

                    {/* Visual notes */}
                    <div>
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Visual Notes</label>
                      <textarea
                        value={scene.visual_notes || ''}
                        onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, visual_notes: e.target.value } : s))}
                        onBlur={e => updateSceneField(scene.id, 'visual_notes', e.target.value)}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 resize-none"
                        rows={3}
                        placeholder="Camera angle, lighting, mood..."
                      />
                    </div>

                    {/* Video prompt - full width */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Video Prompt</label>
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-3 w-4 h-4 text-purple-400/60" />
                        <textarea
                          value={scene.video_prompt || ''}
                          onChange={e => setScenes(prev => prev.map(s => s.id === scene.id ? { ...s, video_prompt: e.target.value } : s))}
                          onBlur={e => updateSceneField(scene.id, 'video_prompt', e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 resize-none"
                          rows={2}
                          placeholder="AI generation prompt for this scene..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI bar */}
      <div className="px-8 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Adjust storyboard with AI... (e.g. 'Add a transition scene', 'Improve visual prompts')"
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm"
            />
          </div>
          <button
            disabled={!aiPrompt.trim()}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Adjust
          </button>
        </div>
      </div>
    </div>
  );
}
