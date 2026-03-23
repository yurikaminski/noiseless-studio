import { X } from 'lucide-react';
import { useState } from 'react';

interface SettingsState {
  model: string;
  aspectRatio: string;
  resolution: string;
  generateSound: boolean;
  styleSettings: string;
  lightSettings: string;
}

interface SettingsProps {
  mode: 'quick' | 'projects';
  projectPrompt: string;
  setProjectPrompt: (value: string) => void;
  settings: SettingsState;
  setSettings: (settings: SettingsState) => void;
  creationType: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video' | null;
  onClose: () => void;
}

export function Settings({ 
  mode,
  projectPrompt, 
  setProjectPrompt, 
  settings, 
  setSettings,
  creationType,
  onClose 
}: SettingsProps) {
  const [generationTab, setGenerationTab] = useState<'text' | 'image' | 'video'>('text');

  const getCreationTypeLabel = () => {
    if (!creationType) return 'Generation Settings';
    return creationType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') + ' Settings';
  };

  // Project Settings View
  if (mode === 'projects') {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-[420px] z-50 animate-in slide-in-from-right duration-300">
        <div className="h-full bg-black/40 backdrop-blur-2xl border-l border-white/10 flex flex-col">
          {/* Header */}
          <div className="px-6 py-6 flex items-center justify-between border-b border-white/10">
            <div>
              <h2 className="text-lg text-white/90">Project Settings</h2>
              <p className="text-xs text-white/40 mt-1">Configure project and generation settings</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {/* Project Settings Section */}
            <div className="space-y-5">
              <h3 className="text-sm text-white/70 font-medium">Project Settings</h3>
              
              {/* Project Name */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Project Name</label>
                <input
                  type="text"
                  placeholder="My Project"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Project Description</label>
                <textarea
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Project Prompt */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Project Prompt</label>
                <p className="text-xs text-white/30 mb-2">Applied to all generations in this project</p>
                <textarea
                  placeholder="Common style, theme, or instructions for all segments..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Text Prompt */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Text Prompt</label>
                <textarea
                  placeholder="Additional instructions for text generation..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Image Prompt */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Image Prompt</label>
                <textarea
                  placeholder="Additional instructions for image generation..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Video Prompt */}
              <div>
                <label className="block text-xs text-white/50 mb-2">Video Prompt</label>
                <textarea
                  placeholder="Additional instructions for video generation..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>
            </div>

            {/* Generation Settings Section */}
            <div className="space-y-6 border-t border-white/10 pt-6">
              <h3 className="text-sm text-white/70 font-medium">Generation Default Settings</h3>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
                <button
                  onClick={() => setGenerationTab('text')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    generationTab === 'text'
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  Text
                </button>
                <button
                  onClick={() => setGenerationTab('image')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    generationTab === 'image'
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  Image
                </button>
                <button
                  onClick={() => setGenerationTab('video')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    generationTab === 'video'
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  Video
                </button>
              </div>

              {/* Text Settings */}
              {generationTab === 'text' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Model</label>
                    <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all">
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="claude-3">Claude 3</option>
                      <option value="gemini-pro">Gemini Pro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-2">Temperature</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>0.0</span>
                      <span>1.0</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-2">Top-p</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.9"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/30 mt-1">
                      <span>0.0</span>
                      <span>1.0</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Settings */}
              {generationTab === 'image' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Model</label>
                    <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all">
                      <option value="dall-e-3">DALL-E 3</option>
                      <option value="midjourney">Midjourney</option>
                      <option value="stable-diffusion">Stable Diffusion XL</option>
                      <option value="flux">Flux</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-2">Lens/Focus</label>
                    <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all">
                      <option value="standard">Standard</option>
                      <option value="wide-angle">Wide Angle</option>
                      <option value="telephoto">Telephoto</option>
                      <option value="macro">Macro</option>
                      <option value="portrait">Portrait</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-2">Aspect Ratio</label>
                    <select 
                      value={settings.aspectRatio}
                      onChange={(e) => setSettings({...settings, aspectRatio: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                    >
                      <option value="1:1">1:1 (Square)</option>
                      <option value="16:9">16:9 (Landscape)</option>
                      <option value="9:16">9:16 (Portrait)</option>
                      <option value="4:3">4:3</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Video Settings */}
              {generationTab === 'video' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-2">Model</label>
                    <select 
                      value={settings.model}
                      onChange={(e) => setSettings({...settings, model: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                    >
                      <option value="fast-veo-3.1">Fast Veo 3.1</option>
                      <option value="sora">Sora</option>
                      <option value="runway-gen3">Runway Gen-3</option>
                      <option value="pika">Pika</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-2">Resolution</label>
                    <select 
                      value={settings.resolution}
                      onChange={(e) => setSettings({...settings, resolution: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p (HD)</option>
                      <option value="1080p">1080p (Full HD)</option>
                      <option value="4k">4K (Ultra HD)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/50">Generate Sound</label>
                    <button
                      onClick={() => setSettings({...settings, generateSound: !settings.generateSound})}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        settings.generateSound ? 'bg-purple-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        settings.generateSound ? 'translate-x-5' : ''
                      }`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quick Generation Settings View
  return (
    <div className="absolute right-0 top-0 bottom-0 w-[420px] z-50 animate-in slide-in-from-right duration-300">
      <div className="h-full bg-black/40 backdrop-blur-2xl border-l border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-lg text-white/90">{getCreationTypeLabel()}</h2>
            {creationType && (
              <p className="text-xs text-white/40 mt-1">
                Configure your {creationType.replace(/-/g, ' ')} generation
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <div className="space-y-8">
            
            {/* Project Prompt */}
            <div className="space-y-3">
              <label className="text-sm text-white/70">Project Prompt</label>
              <textarea
                placeholder="Add context to all your generations..."
                value={projectPrompt}
                onChange={(e) => setProjectPrompt(e.target.value)}
                className="w-full h-28 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm text-white/90 placeholder:text-white/30 outline-none resize-none transition-all focus:border-white/20 focus:bg-white/10"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Model Selection */}
            <div className="space-y-4">
              <label className="text-sm text-white/70">Model</label>
              <div className="grid grid-cols-1 gap-2">
                {['fast-veo-3.1', 'standard', 'pro'].map((model) => (
                  <button
                    key={model}
                    onClick={() => setSettings({ ...settings, model })}
                    className={`px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                      settings.model === model
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    {model === 'fast-veo-3.1' ? 'Fast (Veo 3.1)' : model.charAt(0).toUpperCase() + model.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-4">
              <label className="text-sm text-white/70">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: '16:9', label: '16:9', desc: 'Landscape' },
                  { value: '9:16', label: '9:16', desc: 'Portrait' },
                  { value: '1:1', label: '1:1', desc: 'Square' },
                  { value: '4:3', label: '4:3', desc: 'Standard' }
                ].map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setSettings({ ...settings, aspectRatio: ratio.value })}
                    className={`px-4 py-3 rounded-xl text-sm transition-all border ${
                      settings.aspectRatio === ratio.value
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    <div className="font-medium">{ratio.label}</div>
                    <div className="text-xs text-white/40 mt-0.5">{ratio.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-4">
              <label className="text-sm text-white/70">Resolution</label>
              <div className="grid grid-cols-3 gap-2">
                {['720p', '1080p', '4k'].map((res) => (
                  <button
                    key={res}
                    onClick={() => setSettings({ ...settings, resolution: res })}
                    className={`px-4 py-3 rounded-xl text-sm transition-all border ${
                      settings.resolution === res
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    {res.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Sound Toggle */}
            <div className="flex items-center justify-between py-2">
              <label className="text-sm text-white/70">Generate Sound</label>
              <button
                onClick={() => setSettings({ ...settings, generateSound: !settings.generateSound })}
                className={`relative w-12 h-7 rounded-full transition-all ${
                  settings.generateSound 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                    : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-lg ${
                    settings.generateSound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Creative Control */}
            <div className="space-y-6">
              <h3 className="text-xs text-white/50 tracking-widest">CREATIVE CONTROL</h3>
              
              {/* Style Settings */}
              <div className="space-y-3">
                <label className="text-sm text-white/70">Style</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: '', label: 'Default' },
                    { value: 'cinematic', label: 'Cinematic' },
                    { value: 'anime', label: 'Anime' },
                    { value: 'realistic', label: 'Realistic' }
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => setSettings({ ...settings, styleSettings: style.value })}
                      className={`px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                        settings.styleSettings === style.value
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Light Settings */}
              <div className="space-y-3">
                <label className="text-sm text-white/70">Lighting</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { value: '', label: 'Default' },
                    { value: 'natural', label: 'Natural' },
                    { value: 'dramatic', label: 'Dramatic' },
                    { value: 'soft', label: 'Soft' }
                  ].map((light) => (
                    <button
                      key={light.value}
                      onClick={() => setSettings({ ...settings, lightSettings: light.value })}
                      className={`px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                        settings.lightSettings === light.value
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      {light.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}