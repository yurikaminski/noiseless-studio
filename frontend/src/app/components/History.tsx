import { Video, Image, X } from 'lucide-react';

interface HistoryItem {
  id: number;
  type: 'video' | 'image';
  title: string;
  description: string;
  date: string;
}

interface HistoryProps {
  items: HistoryItem[];
  onClose: () => void;
}

export function History({ items, onClose }: HistoryProps) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-96 z-50 animate-in slide-in-from-left duration-300">
      <div className="h-full bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-6 flex items-center justify-between">
          <h2 className="text-lg text-white/90">Recent Generations</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                className="w-full px-4 py-4 rounded-2xl text-left transition-all hover:bg-white/5 group border border-transparent hover:border-white/10"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1 p-2 rounded-xl bg-white/5 text-white/40 group-hover:text-white/70 group-hover:bg-white/10 transition-all">
                    {item.type === 'video' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm text-white/80 group-hover:text-white mb-1 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/40 line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <span className="text-xs text-white/30">
                      {item.date}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
