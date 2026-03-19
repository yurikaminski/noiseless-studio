import { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { Video, Calendar } from 'lucide-react';
import type { VideoCard } from './ProjectsView';

const stageColors: Record<string, string> = {
  ideas:      'bg-purple-500/10 border-purple-500/20 text-purple-300',
  script:     'bg-blue-500/10 border-blue-500/20 text-blue-300',
  storyboard: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300',
  generating: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
  review:     'bg-orange-500/10 border-orange-500/20 text-orange-300',
  published:  'bg-green-500/10 border-green-500/20 text-green-300',
};

interface VideoSegmentCardProps {
  card: VideoCard;
  onClick?: () => void;
}

export function VideoSegmentCard({ card, onClick }: VideoSegmentCardProps) {
  const didDrag = useRef(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'video-card',
    item: () => {
      didDrag.current = false;
      return { id: card.id };
    },
    collect: (monitor) => {
      if (monitor.isDragging()) didDrag.current = true;
      return { isDragging: monitor.isDragging() };
    },
  }));

  const handleClick = () => {
    if (!didDrag.current) onClick?.();
    didDrag.current = false;
  };

  const stageColor = stageColors[card.stage] || stageColors.ideas;
  const date = new Date(card.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' });

  return (
    <div
      ref={drag}
      onClick={handleClick}
      className={`p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl transition-all hover:border-white/20 hover:bg-white/10 select-none ${
        isDragging ? 'opacity-40 cursor-grabbing' : 'cursor-pointer'
      }`}
    >
      {/* Thumbnail placeholder */}
      <div className="w-full aspect-video rounded-xl mb-3 flex items-center justify-center bg-white/5 border border-white/10">
        <Video className="w-6 h-6 text-white/20" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h4 className="text-sm text-white line-clamp-1">{card.title}</h4>

        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded-md text-xs border ${stageColor}`}>
            {card.stage}
          </span>
          <div className="flex items-center gap-1 text-xs text-white/30">
            <Calendar className="w-3 h-3" />
            <span>{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
