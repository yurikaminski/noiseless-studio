import { Sparkles, Send, Video, Image, Film, Layers } from 'lucide-react';

interface MainContentProps {
  prompt: string;
  setPrompt: (value: string) => void;
  creationType: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video' | null;
  onCreationTypeSelect: (type: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video') => void;
}

export function MainContent({ prompt, setPrompt, creationType, onCreationTypeSelect }: MainContentProps) {
  const creationTypes = [
    { id: 'text-to-video', label: 'Text to Video', icon: Video },
    { id: 'text-to-image', label: 'Text to Image', icon: Image },
    { id: 'frames-to-video', label: 'Frames to Video', icon: Film },
    { id: 'references-to-video', label: 'References to Video', icon: Layers }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
      {/* Main Content Area */}
      <div className="max-w-3xl w-full space-y-12">
        {/* Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-6xl tracking-tight mb-3 bg-gradient-to-br from-white via-white/90 to-white/60 bg-clip-text text-transparent">
            Noiseless Studio
          </h1>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            Create stunning videos from text descriptions
          </p>
        </div>

        {/* Input Area - Floating Card */}
        <div className="space-y-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-2 shadow-2xl">
              <div className="flex flex-col gap-3">
                {/* Input Field */}
                <div className="flex items-center gap-3 px-4">
                  <input
                    type="text"
                    placeholder="Describe your video in detail..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder:text-white/30 py-4 text-base"
                    onKeyDown={(e) => e.key === 'Enter' && console.log('Generate')}
                  />
                  <button 
                    className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!prompt.trim()}
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {creationTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = creationType === type.id;
              return (
                <button 
                  key={type.id}
                  onClick={() => onCreationTypeSelect(type.id as any)}
                  className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white/90'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{type.label}</span>
                </button>
              );
            })}
          </div>

          {/* Info Text */}
          <p className="text-xs text-white/25 text-center">
            All resolutions supported • Fast generation • High quality output
          </p>
        </div>
      </div>
    </div>
  );
}