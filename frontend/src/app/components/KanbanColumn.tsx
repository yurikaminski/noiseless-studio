import { useDrop } from 'react-dnd';
import { VideoSegmentCard } from './VideoSegmentCard';
import { Plus } from 'lucide-react';
import type { VideoCard } from './ProjectsView';

interface Column {
  id: string;
  title: string;
  color: string;
}

interface KanbanColumnProps {
  column: Column;
  cards: VideoCard[];
  onMove: (cardId: number, newStage: string) => void;
  onCardClick: (card: VideoCard) => void;
  onAddCard: (columnId: string) => void;
}

export function KanbanColumn({ column, cards, onMove, onCardClick, onAddCard }: KanbanColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'video-card',
    drop: (item: { id: number }) => {
      onMove(item.id, column.id);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={drop}
      className={`flex flex-col bg-white/5 backdrop-blur-xl border rounded-3xl overflow-hidden transition-all ${
        isOver ? 'border-white/30 bg-white/10' : 'border-white/10'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className={`text-sm ${column.color}`}>{column.title}</h3>
          <button
            onClick={() => onAddCard(column.id)}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-white/40" />
          </button>
        </div>
        <span className="text-xs text-white/40">{cards.length} video{cards.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Column Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {cards.map(card => (
          <VideoSegmentCard
            key={card.id}
            card={card}
            onClick={() => onCardClick(card)}
          />
        ))}

        {cards.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed border-white/10 rounded-2xl">
            <p className="text-xs text-white/30">Drop videos here</p>
          </div>
        )}
      </div>
    </div>
  );
}
