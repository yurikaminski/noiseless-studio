import { useState, useEffect, lazy, Suspense } from 'react';
import { History } from './components/History';
import type { HistoryItem } from './components/History';
import { MainContent } from './components/MainContent';
import { Clock, Settings2, Zap, LayoutGrid, Video, Image, X, Download, LogOut } from 'lucide-react';
import { apiFetch } from './lib/api';
import { useAuth, type AuthUser } from './context/AuthContext';
import { AuthRouter } from './components/auth/AuthRouter';

const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const ProjectsView = lazy(() => import('./components/ProjectsView').then(m => ({ default: m.ProjectsView })));

// ── Authenticated app shell ────────────────────────────────────────────────────
function AuthenticatedApp({ user, logout }: { user: AuthUser; logout: () => Promise<void> }) {
  const [mode, setMode] = useState<'quick' | 'projects'>('quick');
  const [prompt, setPrompt] = useState('');
  const [projectPrompt, setProjectPrompt] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [creationType, setCreationType] = useState<'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video' | null>(null);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyPreview, setHistoryPreview] = useState<HistoryItem | null>(null);
  const [settings, setSettings] = useState({
    videoModel: 'veo-3.1-generate-preview',
    imageModel: 'gemini-3.1-flash-image-preview',
    aspectRatio: '16:9',
    resolution: '720p',
    generateSound: false,
    styleSettings: '',
    lightSettings: '',
    duration: '8',
  });

  useEffect(() => {
    apiFetch('/api/generations')
      .then(r => r.json())
      .then((data: any[]) => {
        setHistoryItems(data.map(g => ({
          id: g.id,
          type: g.type as 'video' | 'image',
          title: g.title,
          description: g.prompt,
          date: new Date(g.timestamp).toLocaleDateString(),
          filename: g.filename,
        })));
      })
      .catch(() => {});
  }, []);

  const handleCreationTypeSelect = (type: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video') => {
    setCreationType(type);
  };

  function handleHistoryItemClick(item: HistoryItem) {
    setHistoryPreview(item);
    setShowHistory(false);
  }

  return (
    <div className="size-full flex bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Mode Switcher - Top Center */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50">
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

      {/* Floating Action Buttons - Top Left */}
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

      {/* Top Right: User Menu + Settings */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        {/* User avatar + dropdown */}
        <div className="relative group">
          <button className="p-1.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.name || ''} className="w-7 h-7 rounded-xl object-cover" />
              : <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-purple-500/40 to-pink-500/40 flex items-center justify-center text-xs font-medium text-white/80">
                  {(user.name || user.email).charAt(0).toUpperCase()}
                </div>
            }
          </button>
          <div className="absolute right-0 top-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-2 w-52 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all">
            <div className="px-3 py-2 mb-1">
              <p className="text-sm text-white/80 font-medium truncate">{user.name || 'User'}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
            <div className="border-t border-white/10 pt-1">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Settings gear */}
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
          <History
            items={historyItems}
            onClose={() => setShowHistory(false)}
            onItemClick={handleHistoryItemClick}
          />
        </>
      )}

      {/* Main Content */}
      {mode === 'quick' ? (
        <MainContent
          prompt={prompt}
          setPrompt={setPrompt}
          creationType={creationType}
          onCreationTypeSelect={handleCreationTypeSelect}
          settings={settings}
        />
      ) : (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" /></div>}>
          <ProjectsView />
        </Suspense>
      )}

      {/* Settings Sidebar */}
      {showSettings && (
        <>
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setShowSettings(false)}
          />
          <Suspense fallback={null}>
            <Settings
              mode={mode}
              projectPrompt={projectPrompt}
              setProjectPrompt={setProjectPrompt}
              settings={settings}
              setSettings={setSettings}
              creationType={creationType}
              onClose={() => setShowSettings(false)}
            />
          </Suspense>
        </>
      )}

      {/* History Preview Modal */}
      {historyPreview && (
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={() => setHistoryPreview(null)}
        >
          <div
            className="bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-white/5 text-white/50 shrink-0">
                  {historyPreview.type === 'video' ? (
                    <Video className="w-4 h-4" />
                  ) : (
                    <Image className="w-4 h-4" />
                  )}
                </div>
                <span className="text-sm text-white/80 truncate">{historyPreview.title}</span>
              </div>
              <button
                onClick={() => setHistoryPreview(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors shrink-0 ml-4"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Media */}
            <div className="bg-black/30">
              {historyPreview.type === 'image' ? (
                <img
                  src={`/uploads/${historyPreview.filename}`}
                  alt={historyPreview.title}
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : (
                <video
                  src={`/uploads/${historyPreview.filename}`}
                  controls
                  autoPlay
                  loop
                  className="w-full max-h-[60vh]"
                />
              )}
            </div>

            {/* Prompt + Actions */}
            <div className="px-6 py-4 space-y-3">
              <div>
                <p className="text-xs text-white/30 mb-1">Prompt</p>
                <p className="text-sm text-white/70 leading-relaxed">{historyPreview.description}</p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-white/30">{historyPreview.date}</span>
                <a
                  href={`/uploads/${historyPreview.filename}`}
                  download
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60 hover:bg-white/10 hover:text-white transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Root component (auth gate) ─────────────────────────────────────────────────
export default function App() {
  const { user, loading, logout } = useAuth();

  if (loading) return (
    <div className="size-full flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
    </div>
  );

  if (!user) return <AuthRouter />;

  return <AuthenticatedApp user={user} logout={logout} />;
}
