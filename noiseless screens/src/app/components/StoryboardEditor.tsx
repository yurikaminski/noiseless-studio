import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Clock, Image as ImageIcon, Sparkles, Wand2, Video } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Scene {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  initialFrame: string;
  endFrame: string;
  videoPrompt: string;
  details?: {
    cameraAngle?: string;
    lighting?: string;
    soundEffects?: string;
    notes?: string;
  };
}

export function StoryboardEditor() {
  const [scenes, setScenes] = useState<Scene[]>([
    {
      id: '1',
      startTime: '00:00',
      endTime: '00:12',
      description: 'Detective introduces the dilemma',
      initialFrame: 'https://images.unsplash.com/photo-1769527820343-9e9afd69c78b?w=400',
      endFrame: 'https://images.unsplash.com/photo-1769527820343-9e9afd69c78b?w=400',
      videoPrompt: 'Introduce the dilemma and show split-screen of prisoners.',
      details: {
        cameraAngle: 'Medium shot, eye-level',
        lighting: 'Harsh fluorescent, high contrast',
        soundEffects: 'Ambient room tone, distant footsteps',
        notes: 'Establish the interrogation room setting'
      }
    },
    {
      id: '2',
      startTime: '00:12',
      endTime: '00:30',
      description: 'Suspects shown in separate rooms',
      initialFrame: 'https://images.unsplash.com/photo-1764250766584-c0259d99908f?w=400',
      endFrame: 'https://images.unsplash.com/photo-1764250766584-c0259d99908f?w=400',
      videoPrompt: 'Explain that each suspect is in a separate room.',
      details: {
        cameraAngle: 'Split-screen, close-up on faces',
        lighting: 'Cold blue tones',
        soundEffects: 'Nervous breathing, chair creaking',
        notes: 'Show isolation and tension'
      }
    },
    {
      id: '3',
      startTime: '00:30',
      endTime: '00:45',
      description: 'Detective explains options',
      initialFrame: 'https://images.unsplash.com/photo-1769527820343-9e9afd69c78b?w=400',
      endFrame: 'https://images.unsplash.com/photo-1764250766584-c0259d99908f?w=400',
      videoPrompt: 'Outline the choices the prisoners have.',
      details: {
        cameraAngle: 'Over-the-shoulder shot',
        lighting: 'Dramatic side lighting',
        soundEffects: 'Detective\'s voice echo',
        notes: 'Build psychological pressure'
      }
    },
    {
      id: '4',
      startTime: '00:45',
      endTime: '01:00',
      description: 'Clock ticking and suspects debating',
      initialFrame: 'https://images.unsplash.com/photo-1723045862559-caa5339cc765?w=400',
      endFrame: 'https://images.unsplash.com/photo-1764250766584-c0259d99908f?w=400',
      videoPrompt: 'Build tension as the suspects consider their options.',
      details: {
        cameraAngle: 'Close-up on clock, then faces',
        lighting: 'Low-key, shadows on face',
        soundEffects: 'Loud clock ticking, heartbeat',
        notes: 'Peak tension moment'
      }
    }
  ]);

  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  const toggleScene = (sceneId: string) => {
    const newExpanded = new Set(expandedScenes);
    if (newExpanded.has(sceneId)) {
      newExpanded.delete(sceneId);
    } else {
      newExpanded.add(sceneId);
    }
    setExpandedScenes(newExpanded);
  };

  const handleAddScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      startTime: '00:00',
      endTime: '00:00',
      description: 'Nova cena',
      initialFrame: '',
      endFrame: '',
      videoPrompt: '',
    };
    setScenes([...scenes, newScene]);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <h2 className="text-xl font-light text-white">STORYBOARD</h2>
        <button
          onClick={handleAddScene}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Cena
        </button>
      </div>

      {/* Table Header */}
      <div className="px-8 py-3 border-b border-white/10 bg-black/10">
        <div className="grid grid-cols-[40px_80px_80px_1fr_140px_140px_180px] gap-4 text-xs font-medium text-white/40 uppercase tracking-wider">
          <div></div>
          <div>Start Time</div>
          <div>End Time</div>
          <div>Description</div>
          <div>Initial Frame</div>
          <div>End Frame</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Scenes List */}
      <div className="flex-1 overflow-y-auto">
        {scenes.map((scene, index) => {
          const isExpanded = expandedScenes.has(scene.id);
          
          return (
            <div key={scene.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              {/* Main Row */}
              <div
                className="px-8 py-3 cursor-pointer"
                onClick={() => toggleScene(scene.id)}
              >
                <div className="grid grid-cols-[40px_80px_80px_1fr_140px_140px_180px] gap-4 items-center">
                  {/* Expand Button */}
                  <div className="flex items-center justify-center">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-white/40" />
                    )}
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Clock className="w-3 h-3 text-white/30" />
                    {scene.startTime}
                  </div>

                  {/* End Time */}
                  <div className="flex items-center gap-1.5 text-white/60 text-sm">
                    <Clock className="w-3 h-3 text-white/30" />
                    {scene.endTime}
                  </div>

                  {/* Description */}
                  <div className="text-white/90 text-sm">
                    {scene.description}
                  </div>

                  {/* Initial Frame */}
                  <div>
                    {scene.initialFrame ? (
                      <ImageWithFallback
                        src={scene.initialFrame}
                        alt="Initial frame"
                        className="w-full h-16 object-cover rounded-lg border border-white/10"
                      />
                    ) : (
                      <div className="w-full h-16 bg-white/5 border border-white/10 border-dashed rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* End Frame */}
                  <div>
                    {scene.endFrame ? (
                      <ImageWithFallback
                        src={scene.endFrame}
                        alt="End frame"
                        className="w-full h-16 object-cover rounded-lg border border-white/10"
                      />
                    ) : (
                      <div className="w-full h-16 bg-white/5 border border-white/10 border-dashed rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button className="w-full px-2.5 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                      <Wand2 className="w-3 h-3" />
                      Frames
                    </button>
                    <button className="w-full px-2.5 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                      <Video className="w-3 h-3" />
                      Scene
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && scene.details && (
                <div className="px-8 pb-6 pt-2 bg-white/[0.02]">
                  <div className="ml-[40px] grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                          Camera Angle
                        </label>
                        <input
                          type="text"
                          value={scene.details.cameraAngle}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                          Lighting
                        </label>
                        <input
                          type="text"
                          value={scene.details.lighting}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                          Sound Effects
                        </label>
                        <input
                          type="text"
                          value={scene.details.soundEffects}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={scene.details.notes}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Full Width Video Prompt */}
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">
                        Video Prompt
                      </label>
                      <div className="relative">
                        <Sparkles className="absolute left-3 top-3 w-4 h-4 text-purple-400/60" />
                        <textarea
                          value={scene.videoPrompt}
                          className="w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white/80 text-sm focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all resize-none"
                          rows={2}
                          readOnly
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

      {/* AI Prompt Bar */}
      <div className="px-8 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className="w-4 h-4 text-white/40" />
            </div>
            <input
              type="text"
              placeholder="Ajuste o storyboard com IA... (ex: 'Adicione uma cena de transição', 'Melhore os prompts visuais')"
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm"
            />
          </div>
          <button className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Ajustar
          </button>
        </div>
      </div>
    </div>
  );
}