import { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Lightbulb, FileText, Film, Wand2, Eye, CheckCircle, Calendar } from 'lucide-react';
import type { VideoCard, Project } from './ProjectsView';
import { IdeasStage } from './card-stages/IdeasStage';
import { ScriptStage } from './card-stages/ScriptStage';
import { StoryboardStage } from './card-stages/StoryboardStage';
import { GeneratingStage } from './card-stages/GeneratingStage';
import { ReviewStage } from './card-stages/ReviewStage';
import { PublishedStage } from './card-stages/PublishedStage';

export interface CardLink {
  id: number;
  card_id: number;
  url: string;
  title: string;
  created_at: string;
}

export interface CardScene {
  id: number;
  card_id: number;
  order_index: number;
  description: string;
  narration: string;
  start_time: string;
  end_time: string;
  visual_notes: string;
  video_prompt: string;
  frame_a_url: string;
  frame_b_url: string;
  video_url: string;
  status: string;
  created_at: string;
}

export interface VideoCardFull extends VideoCard {
  links: CardLink[];
  scenes: CardScene[];
}

interface VideoCardModalProps {
  card: VideoCard;
  project: Project;
  onClose: () => void;
  onStageChange: (cardId: number, stage: string) => void;
}

const workflowStages = [
  { id: 'ideas',      label: 'Ideas',      icon: Lightbulb,    color: 'from-yellow-500 to-amber-500'  },
  { id: 'script',     label: 'Script',     icon: FileText,     color: 'from-blue-500 to-cyan-500'     },
  { id: 'storyboard', label: 'Storyboard', icon: Film,         color: 'from-purple-500 to-pink-500'   },
  { id: 'generating', label: 'Generating', icon: Wand2,        color: 'from-orange-500 to-yellow-500' },
  { id: 'review',     label: 'Review',     icon: Eye,          color: 'from-orange-500 to-red-500'    },
  { id: 'published',  label: 'Published',  icon: CheckCircle,  color: 'from-green-500 to-emerald-500' },
];

export function VideoCardModal({ card, project, onClose, onStageChange }: VideoCardModalProps) {
  const [fullCard, setFullCard] = useState<VideoCardFull | null>(null);
  const [selectedStage, setSelectedStage] = useState(card.stage);
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState(card.title);
  const titleRef = useRef<HTMLInputElement>(null);

  const currentStageIndex = workflowStages.findIndex(s => s.id === card.stage);

  const loadCard = () => {
    fetch(`/api/cards/${card.id}`)
      .then(r => r.json())
      .then((data: VideoCardFull) => {
        setFullCard(data);
        setTitle(data.title);
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadCard();
  }, [card.id]);

  const saveTitle = async () => {
    if (title.trim() === card.title) return;
    await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() || 'Untitled Video' }),
    });
  };

  const handleStageChange = async (newStage: string) => {
    await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    });
    onStageChange(card.id, newStage);
    setFullCard(prev => prev ? { ...prev, stage: newStage } : prev);
  };

  const containerClass = isExpanded
    ? 'fixed inset-8 z-[210]'
    : 'fixed inset-0 z-[210] flex items-center justify-center p-4';

  const innerClass = isExpanded
    ? 'w-full h-full'
    : 'w-full max-w-[920px] max-h-[88vh]';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={containerClass}>
        <div className={`${innerClass} bg-neutral-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col`}>

          {/* Header */}
          <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
            <div className="flex items-center gap-6 min-w-0 flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Project</span>
                <span className="text-sm text-white/90">{project.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs text-white/40">{new Date(card.created_at).toLocaleDateString()}</span>
              </div>
              {/* Editable title */}
              <input
                ref={titleRef}
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={e => e.key === 'Enter' && titleRef.current?.blur()}
                className="flex-1 bg-transparent text-white text-sm font-medium focus:outline-none focus:border-b focus:border-white/30 min-w-0 truncate"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsExpanded(v => !v)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                {isExpanded
                  ? <Minimize2 className="w-4 h-4 text-white/60" />
                  : <Maximize2 className="w-4 h-4 text-white/60" />
                }
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar */}
            <div className="w-56 shrink-0 bg-black/20 backdrop-blur-xl border-r border-white/10 p-5 overflow-y-auto">
              <div className="space-y-1.5">
                {workflowStages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isSelected = stage.id === selectedStage;
                  const isCompleted = index < currentStageIndex;

                  return (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedStage(stage.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                        isSelected
                          ? 'bg-white/10 border border-white/20'
                          : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center shrink-0 ${
                        !isSelected ? 'opacity-60 group-hover:opacity-100' : ''
                      }`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-sm flex-1 ${isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/90'}`}>
                        {stage.label}
                      </span>
                      {isCompleted && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!fullCard ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-white/40 text-sm">Loading...</p>
                </div>
              ) : selectedStage === 'ideas' ? (
                <IdeasStage card={fullCard} onUpdate={loadCard} />
              ) : selectedStage === 'script' ? (
                <ScriptStage card={fullCard} onUpdate={loadCard} />
              ) : selectedStage === 'storyboard' ? (
                <StoryboardStage card={fullCard} onUpdate={loadCard} />
              ) : selectedStage === 'generating' ? (
                <GeneratingStage card={fullCard} onUpdate={loadCard} />
              ) : selectedStage === 'review' ? (
                <ReviewStage
                  card={fullCard}
                  onUpdate={loadCard}
                  onMoveToPublished={() => handleStageChange('published').then(() => setSelectedStage('published'))}
                />
              ) : selectedStage === 'published' ? (
                <PublishedStage card={fullCard} onUpdate={loadCard} />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
