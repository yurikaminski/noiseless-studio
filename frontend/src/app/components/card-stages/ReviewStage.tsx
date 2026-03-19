import { useRef } from 'react';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { VideoCardFull } from '../VideoCardModal';

interface ReviewStageProps {
  card: VideoCardFull;
  onUpdate: () => void;
  onMoveToPublished: () => void;
}

export function ReviewStage({ card, onUpdate, onMoveToPublished }: ReviewStageProps) {
  const [notes, setNotes] = useState(card.review_notes || '');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const autoSave = (value: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await fetch(`/api/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_notes: value }),
      });
    }, 800);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
        <h2 className="text-xl font-light text-white">REVIEW</h2>
        <button
          onClick={onMoveToPublished}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 hover:from-green-500/30 hover:to-emerald-500/30 rounded-xl text-sm font-medium transition-all"
        >
          Move to Published
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Notes area */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3 block">
            Review Notes
          </label>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); autoSave(e.target.value); }}
            className="w-full min-h-[400px] px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white/90 text-base leading-relaxed resize-none focus:outline-none focus:border-white/20 placeholder-white/25"
            placeholder="Add review notes, feedback, changes needed, or approval notes..."
          />
          <p className="text-xs text-white/30 mt-2">Auto-saved as you type</p>

          {/* Checklist hint */}
          <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-sm font-medium text-white/60 mb-3">Review checklist</p>
            <ul className="space-y-2 text-sm text-white/40">
              {['Script is complete and approved', 'All storyboard scenes are defined', 'Frames generated for key scenes', 'Video clips reviewed', 'Ready for publishing'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded border border-white/20 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
