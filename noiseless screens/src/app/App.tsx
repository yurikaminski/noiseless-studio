import { useState } from 'react';
import { History } from './components/History';
import { MainContent } from './components/MainContent';
import { Settings } from './components/Settings';
import { ProjectsView } from './components/ProjectsView';
import { Menu, Clock, Settings2, Zap, LayoutGrid } from 'lucide-react';

export default function App() {
  const [mode, setMode] = useState<'quick' | 'projects'>('quick');
  const [prompt, setPrompt] = useState('');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creationType, setCreationType] = useState<'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video' | null>(null);
  const [settings, setSettings] = useState({
    model: 'fast-veo-3.1',
    aspectRatio: '16:9',
    resolution: '720p',
    generateSound: false,
    styleSettings: '',
    lightSettings: ''
  });

  const historyItems = [
    {
      id: 1,
      type: 'video',
      title: 'The Blank Slate',
      description: 'A coelha devia ser rosa e feminina, o...',
      date: '2/24/2026'
    },
    {
      id: 2,
      type: 'image',
      title: '**Cyberpunk Pink Bunny & Ret...',
      description: 'A coelha devia ser rosa e feminina, o...',
      date: '2/24/2026'
    },
    {
      id: 3,
      type: 'image',
      title: '**Cyberpunk Bunny & Marmot ...',
      description: 'A coelha devia ser rosa e feminina, o...',
      date: '2/24/2026'
    },
    {
      id: 4,
      type: 'image',
      title: '**Beijo da Coelha e Marmota**',
      description: 'A coelha devia ser rosa e feminina, o...',
      date: '2/24/2026'
    },
    {
      id: 5,
      type: 'video',
      title: 'Test Title',
      description: 'Test Prompt',
      date: '2/24/2026'
    }
  ];

  const handleCreationTypeSelect = (type: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video') => {
    setCreationType(type);
    setShowSettings(true);
  };

  return (
    <div className="size-full flex bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Mode Switcher - Top Center */}
      <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 transition-opacity duration-300 ${isModalOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex gap-2 p-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
          <button
            onClick={() => setMode('quick')}
            className={`px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
              mode === 'quick'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            <Zap className="w-4 h-4" />
            Quick Gen
          </button>
          <button
            onClick={() => setMode('projects')}
            className={`px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 ${
              mode === 'projects'
                ? 'bg-white/10 text-white'
                : 'text-white/60 hover:text-white/90'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Projects
          </button>
        </div>
      </div>

      {/* Floating Action Buttons */}
      {mode === 'quick' && (
        <div className="absolute top-6 left-6 z-50 flex gap-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-3 rounded-2xl backdrop-blur-xl border transition-all ${
              showHistory 
                ? 'bg-white/10 border-white/20' 
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-2xl backdrop-blur-xl border transition-all ${
            showSettings 
              ? 'bg-white/10 border-white/20' 
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {/* History Sidebar - Sliding Panel */}
      {showHistory && (
        <>
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowHistory(false)}
          />
          <History items={historyItems} onClose={() => setShowHistory(false)} />
        </>
      )}

      {/* Main Content - Conditional Rendering */}
      {mode === 'quick' ? (
        <MainContent 
          prompt={prompt} 
          setPrompt={setPrompt}
          creationType={creationType}
          onCreationTypeSelect={handleCreationTypeSelect}
        />
      ) : (
        <ProjectsView onModalOpen={setIsModalOpen} />
      )}

      {/* Settings Sidebar - Sliding Panel */}
      {showSettings && (
        <>
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowSettings(false)}
          />
          <Settings 
            mode={mode}
            projectPrompt={projectPrompt}
            setProjectPrompt={setProjectPrompt}
            settings={settings}
            setSettings={setSettings}
            creationType={creationType}
            onClose={() => setShowSettings(false)}
          />
        </>
      )}
    </div>
  );
}