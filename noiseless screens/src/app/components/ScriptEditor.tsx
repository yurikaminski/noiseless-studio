import { useState } from 'react';
import { Type, Bold, Italic, List, ListOrdered, Link as LinkIcon, Undo, Image as ImageIcon, AlignLeft, MoreHorizontal, Sparkles, Save, Download } from 'lucide-react';

export function ScriptEditor() {
  const [scriptContent, setScriptContent] = useState(`Prisoner's Dilemma Video Script

Hook: Have you ever found yourself in a situation where you had to choose between two options, neither of which seems particularly appealing?

In this video, we're going to explore one of the most famous concepts in game theory: the Prisoner's Dilemma.

INT. INTERROGATION ROOM – DAY

Two suspects sit in separate rooms, both faced with the same choice: betray the other for a lighter sentence, or remain silent and risk a harsher punishment.

We'll see the camera cut between them, showcasing their nervous expressions.

Sounds of a ticking clock heighten the tension.

Detective: "You can either betray your partner while he gets 5 years, or stay quiet and risk 3 years for both of you."

This dilemma highlights the conflict between individual self-interest and mutual cooperation. We'll break down the dilemma using easy-to-understand examples, showing how sometimes the "rational" choice might not lead to the best outcome for everyone.`);
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const wordCount = scriptContent.trim().split(/\s+/).filter(word => word.length > 0).length;

  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsGenerating(false);
      setPrompt('');
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar with Actions */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <h2 className="text-xl font-light text-white">SCRIPT</h2>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-2">
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 rounded-xl transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="px-8 py-3 border-b border-white/10 flex items-center gap-1 bg-black/10">
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Heading">
          <Type className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Bold">
          <Bold className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Italic">
          <Italic className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Align Left">
          <AlignLeft className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Bullet List">
          <List className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Numbered List">
          <ListOrdered className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Insert Link">
          <LinkIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Insert Image">
          <ImageIcon className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="Undo">
          <Undo className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
        <div className="flex-1" />
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group" title="More options">
          <MoreHorizontal className="w-4 h-4 text-white/60 group-hover:text-white" />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            className="w-full min-h-[600px] bg-transparent text-white/90 text-base leading-relaxed resize-none focus:outline-none font-normal"
            placeholder="Start writing your script..."
            spellCheck={false}
          />
        </div>
      </div>

      {/* Word Count Footer */}
      <div className="px-8 py-3 border-t border-white/10 bg-black/10 flex items-center justify-between">
        <div className="text-xs text-white/40">
          {wordCount} palavras
        </div>
      </div>

      {/* AI Prompt Bar */}
      <div className="px-8 py-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <Sparkles className={`w-4 h-4 ${isGenerating ? 'text-purple-400 animate-pulse' : 'text-white/40'}`} />
            </div>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePromptSubmit()}
              placeholder="Ajuste o script com IA... (ex: 'Adicione mais emoção no hook', 'Torne o diálogo mais casual')"
              className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all text-sm"
              disabled={isGenerating}
            />
          </div>
          <button
            onClick={handlePromptSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-purple-500/50 disabled:to-pink-500/50 text-white text-sm font-medium rounded-xl transition-all disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Ajustar
              </>
            )}
          </button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="text-xs text-white/30">Sugestões:</div>
          {['Mais dramático', 'Adicionar humor', 'Simplificar linguagem'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setPrompt(suggestion)}
              className="px-3 py-1 text-xs text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
