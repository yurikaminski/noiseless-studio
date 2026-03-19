import { useState, useRef } from 'react';
import { Type, Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Image as ImageIcon, AlignLeft, MoreHorizontal, Sparkles, Save, Download, Loader2 } from 'lucide-react';
import type { VideoCardFull } from '../VideoCardModal';
import { apiFetch } from '../../lib/api';

interface ScriptStageProps {
  card: VideoCardFull;
  onUpdate: () => void;
}

export function ScriptStage({ card, onUpdate }: ScriptStageProps) {
  const [scriptContent, setScriptContent] = useState(card.script || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = scriptContent.trim().split(/\s+/).filter(w => w.length > 0).length;

  const autoSave = (value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await apiFetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: value }),
      });
    }, 800);
  };

  const handleChange = (value: string) => {
    setScriptContent(value);
    autoSave(value);
  };

  const saveNow = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setIsSaving(true);
    await apiFetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: scriptContent }),
    });
    setIsSaving(false);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await apiFetch(`/api/cards/${card.id}/generate-script`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setScriptContent(data.script);
      autoSave(data.script);
    } catch (err: any) {
      alert(err.message || 'Script generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiAdjust = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    // Future: call a refine endpoint
    setAiPrompt('');
  };

  const exportScript = () => {
    const blob = new Blob([scriptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.title.replace(/\s+/g, '_')}_script.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
        <h2 className="text-xl font-light text-white">SCRIPT</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate from Ideas
          </button>
          <button
            onClick={saveNow}
            className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={exportScript}
            disabled={!scriptContent.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl transition-all flex items-center gap-2 disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-3 border-b border-white/10 flex items-center gap-1 bg-black/10 shrink-0">
        {[
          { icon: Type, title: 'Heading' }, { icon: Bold, title: 'Bold' }, { icon: Italic, title: 'Italic' },
        ].map(({ icon: Icon, title }) => (
          <button key={title} className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title={title}>
            <Icon className="w-4 h-4 text-white/60 group-hover:text-white" />
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-1" />
        {[
          { icon: AlignLeft, title: 'Align Left' }, { icon: List, title: 'Bullet List' }, { icon: ListOrdered, title: 'Numbered List' },
        ].map(({ icon: Icon, title }) => (
          <button key={title} className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title={title}>
            <Icon className="w-4 h-4 text-white/60 group-hover:text-white" />
          </button>
        ))}
        <div className="w-px h-6 bg-white/10 mx-1" />
        {[
          { icon: LinkIcon, title: 'Link' }, { icon: ImageIcon, title: 'Image' }, { icon: Undo, title: 'Undo' },
        ].map(({ icon: Icon, title }) => (
          <button key={title} className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title={title}>
            <Icon className="w-4 h-4 text-white/60 group-hover:text-white" />
          </button>
        ))}
        <div className="flex-1" />
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group">
          <MoreHorizontal className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <textarea
            value={scriptContent}
            onChange={e => handleChange(e.target.value)}
            className="w-full min-h-[500px] bg-transparent text-white/90 text-base leading-relaxed resize-none focus:outline-none"
            placeholder={`Start writing your script or click "Generate from Ideas" to create one with AI...`}
            spellCheck={false}
          />
        </div>
      </div>

      {/* Word count */}
      <div className="px-8 py-3 border-t border-white/10 bg-black/10 shrink-0">
        <span className="text-xs text-white/40">{wordCount} words</span>
      </div>

      {/* AI bar */}
      <div className="px-8 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'text-purple-400 animate-pulse' : 'text-white/40'}`} />
            </div>
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiAdjust()}
              placeholder="Adjust script with AI... (e.g. 'Add more emotion to the hook', 'Make it more casual')"
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 text-sm transition-all"
            />
          </div>
          <button
            onClick={handleAiAdjust}
            disabled={!aiPrompt.trim() || isGenerating}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Adjust
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-white/30">Suggestions:</span>
          {['More dramatic', 'Add humor', 'Simplify language'].map(s => (
            <button
              key={s}
              onClick={() => setAiPrompt(s)}
              className="px-3 py-1 text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
