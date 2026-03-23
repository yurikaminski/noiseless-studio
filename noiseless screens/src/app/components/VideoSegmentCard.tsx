import { useDrag } from 'react-dnd';
import { GripVertical } from 'lucide-react';
import type { VideoSegment } from './ProjectsView';

interface VideoSegmentCardProps {
  segment: VideoSegment;
  onClick?: () => void;
}

export function VideoSegmentCard({ segment, onClick }: VideoSegmentCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'video-segment',
    item: { id: segment.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 transition-all cursor-pointer ${
        isDragging ? 'opacity-50' : 'hover:bg-white/15 hover:border-white/30'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-4 h-4 text-white/40" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1 truncate">
            {segment.title}
          </h4>
          <p className="text-xs text-white/50 line-clamp-2 mb-2">
            {segment.description}
          </p>
          <span className="text-xs text-white/40">{segment.duration}</span>
        </div>
      </div>
    </div>
  );
}