import { X, Key, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SettingsState {
  videoModel: string;
  imageModel: string;
  aspectRatio: string;
  resolution: string;
  generateSound: boolean;
  styleSettings: string;
  lightSettings: string;
  duration: string;
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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ connected: boolean; email?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(setDriveStatus)
      .catch(() => {});
  }, []);

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    fetch('/api/config/apikey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    }).catch(() => {});
    setApiKeySaved(true);
    setTimeout(() => setApiKeySaved(false), 2000);
  };

  const connectDrive = () => {
    window.open('/api/auth/google', '_self');
  };

  // ─── Veo API constraints ────────────────────────────────────────────────────
  const isVeo2 = settings.videoModel === 'veo-2.0-generate-001';

  // Duration is forced to 8s when: Veo 3.1 + (1080p/4k OR references/frames mode)
  const durationForcedTo8 =
    !isVeo2 &&
    (settings.resolution === '1080p' ||
      settings.resolution === '4k' ||
      creationType === 'references-to-video' ||
      creationType === 'frames-to-video');

  // Valid duration options per model
  const availableDurations: { value: string; label: string }[] = isVeo2
    ? [
        { value: '5', label: '5s' },
        { value: '6', label: '6s' },
        { value: '8', label: '8s' },
      ]
    : durationForcedTo8
    ? [{ value: '8', label: '8s' }]
    : [
        { value: '4', label: '4s' },
        { value: '6', label: '6s' },
        { value: '8', label: '8s' },
      ];

  // Handle video model change with auto-correction
  const handleVideoModelChange = (newModel: string) => {
    const newIsVeo2 = newModel === 'veo-2.0-generate-001';
    const updated: SettingsState = { ...settings, videoModel: newModel };

    if (newIsVeo2) {
      // Veo 2: force 720p, valid durations 5/6/8, no sound
      updated.resolution = '720p';
      if (!['5', '6', '8'].includes(updated.duration)) updated.duration = '8';
      updated.generateSound = false;
    } else {
      // Veo 3.1: valid durations 4/6/8; if coming from Veo 2 with '5', bump to '4'
      if (!['4', '6', '8'].includes(updated.duration)) updated.duration = '4';
      // If resolution forces 8s, correct duration
      if (
        (updated.resolution === '1080p' || updated.resolution === '4k') &&
        updated.duration !== '8'
      ) {
        updated.duration = '8';
      }
    }

    setSettings(updated);
  };

  // Handle resolution change with auto-correction
  const handleResolutionChange = (newRes: string) => {
    const updated: SettingsState = { ...settings, resolution: newRes };
    // 1080p / 4k require duration = 8 on Veo 3.1
    if (!isVeo2 && (newRes === '1080p' || newRes === '4k') && updated.duration !== '8') {
      updated.duration = '8';
    }
    setSettings(updated);
  };
  // ────────────────────────────────────────────────────────────────────────────

  const SystemSection = () => (
    <div className="space-y-5 border-t border-white/10 pt-6">
      <h3 className="text-sm text-white/70 font-medium">System Settings</h3>

      {/* API Key */}
      <div>
        <label className="block text-xs text-white/50 mb-2 flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5" />
          Gemini API Key
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            placeholder="AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all font-mono"
          />
          <button
            onClick={saveApiKey}
            className="px-4 py-2.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-xl text-sm hover:bg-purple-500/30 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            {apiKeySaved ? <CheckCircle2 className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            {apiKeySaved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {/* Google Drive */}
      <div>
        <label className="block text-xs text-white/50 mb-2 flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5" />
          Google Drive
        </label>
        {driveStatus?.connected ? (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-400 font-medium">Connected</p>
              {driveStatus.email && <p className="text-xs text-white/40 truncate">{driveStatus.email}</p>}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-white/30 flex-shrink-0" />
              <p className="text-xs text-white/40">Not connected</p>
            </div>
            <button
              onClick={connectDrive}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <HardDrive className="w-4 h-4" />
              Connect Google Drive
            </button>
          </div>
        )}
      </div>
    </div>
  );

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

            <SystemSection />

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
                    <select
                      value={settings.imageModel}
                      onChange={(e) => setSettings({...settings, imageModel: e.target.value})}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                    >
                      <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash</option>
                      <option value="gemini-3-pro-image-preview">Gemini 3 Pro</option>
                      <option value="gemini-2.5-flash-image">Gemini 2.5 Flash</option>
                      <option value="imagen-4.0-generate-001">Imagen 4.0</option>
                      <option value="imagen-4.0-ultra-generate-001">Imagen 4.0 Ultra</option>
                      <option value="imagen-4.0-fast-generate-001">Imagen 4.0 Fast</option>
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
                      value={settings.videoModel}
                      onChange={(e) => handleVideoModelChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                    >
                      <option value="veo-3.1-generate-preview">Veo 3.1</option>
                      <option value="veo-3.1-fast-generate-preview">Veo 3.1 Fast</option>
                      <option value="veo-2.0-generate-001">Veo 2.0</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-white/50 mb-2">Resolution</label>
                    <select
                      value={settings.resolution}
                      onChange={(e) => handleResolutionChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                    >
                      <option value="720p">720p (HD)</option>
                      {!isVeo2 && <option value="1080p">1080p (Full HD)</option>}
                      {!isVeo2 && <option value="4k">4K (Ultra HD)</option>}
                    </select>
                    {isVeo2 && (
                      <p className="text-xs text-white/30 mt-1">Veo 2.0 supports 720p only</p>
                    )}
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

            {/* Video Model Selection */}
            {(!creationType || creationType !== 'text-to-image') && (
              <div className="space-y-4">
                <label className="text-sm text-white/70">Video Model</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'veo-3.1-generate-preview', label: 'Veo 3.1', desc: 'Best quality · 4/6/8s · up to 4K' },
                    { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast', desc: 'Faster generation · 4/6/8s · up to 4K' },
                    { id: 'veo-2.0-generate-001', label: 'Veo 2.0', desc: 'Previous generation · 5/6/8s · 720p only' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleVideoModelChange(m.id)}
                      className={`px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                        settings.videoModel === m.id
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <div className="font-medium">{m.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Model Selection */}
            {creationType === 'text-to-image' && (
              <div className="space-y-4">
                <label className="text-sm text-white/70">Image Model</label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash', desc: 'Fast, good quality' },
                    { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro', desc: 'Higher quality' },
                    { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash', desc: 'Latest Gemini image' },
                    { id: 'imagen-4.0-generate-001', label: 'Imagen 4.0', desc: 'Photorealistic' },
                    { id: 'imagen-4.0-ultra-generate-001', label: 'Imagen 4.0 Ultra', desc: 'Best photorealism' },
                    { id: 'imagen-4.0-fast-generate-001', label: 'Imagen 4.0 Fast', desc: 'Fastest Imagen' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSettings({ ...settings, imageModel: m.id })}
                      className={`px-4 py-3 rounded-xl text-sm text-left transition-all border ${
                        settings.imageModel === m.id
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      <div className="font-medium">{m.label}</div>
                      <div className="text-xs text-white/40 mt-0.5">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aspect Ratio */}
            <div className="space-y-4">
              <label className="text-sm text-white/70">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                {(creationType === 'text-to-image'
                  ? [
                      { value: '16:9', label: '16:9', desc: 'Landscape' },
                      { value: '9:16', label: '9:16', desc: 'Portrait' },
                      { value: '1:1', label: '1:1', desc: 'Square' },
                      { value: '4:3', label: '4:3', desc: 'Standard' },
                    ]
                  : [
                      { value: '16:9', label: '16:9', desc: 'Landscape' },
                      { value: '9:16', label: '9:16', desc: 'Portrait' },
                    ]
                ).map((ratio) => (
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

            {/* Resolution (video only) */}
            {creationType !== 'text-to-image' && (
              <div className="space-y-4">
                <label className="text-sm text-white/70">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {(isVeo2
                    ? [{ value: '720p', label: '720p', unavailable: false }]
                    : [
                        { value: '720p', label: '720p', unavailable: false },
                        { value: '1080p', label: '1080p', unavailable: false },
                        { value: '4k', label: '4K', unavailable: false },
                      ]
                  ).map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => handleResolutionChange(value)}
                      className={`px-4 py-3 rounded-xl text-sm transition-all border ${
                        settings.resolution === value
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {isVeo2 && (
                  <p className="text-xs text-white/30 -mt-2">Veo 2.0 supports 720p only</p>
                )}
                {!isVeo2 && durationForcedTo8 && (
                  <p className="text-xs text-white/30 -mt-2">
                    {settings.resolution === '1080p' || settings.resolution === '4k'
                      ? 'Duration locked to 8s at this resolution'
                      : 'Duration locked to 8s for this generation type'}
                  </p>
                )}
              </div>
            )}

            {/* Duration (video only) */}
            {creationType !== 'text-to-image' && (
              <div className="space-y-4">
                <label className="text-sm text-white/70">Duration</label>
                <div className={`grid gap-2 ${availableDurations.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  {availableDurations.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setSettings({ ...settings, duration: d.value })}
                      className={`px-4 py-3 rounded-xl text-sm transition-all border ${
                        settings.duration === d.value
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Sound Toggle (video only) */}
            {creationType !== 'text-to-image' && (
              <div className="flex items-center justify-between py-2">
                <div>
                  <label className={`text-sm ${isVeo2 ? 'text-white/30' : 'text-white/70'}`}>
                    Generate Sound
                  </label>
                  {isVeo2 && (
                    <p className="text-xs text-white/25 mt-0.5">Not supported by Veo 2.0</p>
                  )}
                </div>
                <button
                  disabled={isVeo2}
                  onClick={() => !isVeo2 && setSettings({ ...settings, generateSound: !settings.generateSound })}
                  className={`relative w-12 h-7 rounded-full transition-all ${
                    isVeo2
                      ? 'bg-white/5 cursor-not-allowed'
                      : settings.generateSound
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-5 h-5 rounded-full shadow-lg transition-transform ${
                      isVeo2
                        ? 'bg-white/20 translate-x-1'
                        : settings.generateSound
                        ? 'bg-white translate-x-6'
                        : 'bg-white translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}

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

            <SystemSection />

          </div>
        </div>
      </div>
    </div>
  );
}
