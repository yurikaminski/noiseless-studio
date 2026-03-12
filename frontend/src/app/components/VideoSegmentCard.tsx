import { useDrag } from 'react-dnd';
import { Video, MoreVertical, Clock } from 'lucide-react';
import type { VideoSegment } from './ProjectsView';

interface VideoSegmentCardProps {
  segment: VideoSegment;
}

export function VideoSegmentCard({ segment }: VideoSegmentCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'video-segment',
    item: { id: segment.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  const statusColors = {
    planning: 'bg-blue-500/10 border-blue-500/20',
    generating: 'bg-purple-500/10 border-purple-500/20',
    review: 'bg-yellow-500/10 border-yellow-500/20',
    complete: 'bg-green-500/10 border-green-500/20'
  };

  return (
    <div
      ref={drag}
      className={`p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl cursor-move transition-all hover:border-white/20 hover:bg-white/10 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {/* Thumbnail placeholder */}
      <div className={`w-full aspect-video rounded-xl mb-3 flex items-center justify-center border ${statusColors[segment.status]}`}>
        <Video className="w-6 h-6 text-white/30" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm text-white line-clamp-1">{segment.title}</h4>
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0">
            <MoreVertical className="w-3.5 h-3.5 text-white/40" />
          </button>
        </div>
        
        <p className="text-xs text-white/50 line-clamp-2">{segment.description}</p>
        
        <div className="flex items-center gap-2 text-xs text-white/40">
          <Clock className="w-3 h-3" />
          <span>{segment.duration}</span>
        </div>
      </div>
    </div>
  );
}
