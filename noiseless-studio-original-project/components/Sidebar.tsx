import React from 'react';
import { Video } from '@google/genai';

export interface Generation {
  id: number;
  prompt: string;
  title: string;
  filename: string;
  type: 'video' | 'image';
  timestamp: string;
}

interface SidebarProps {
  generations: Generation[];
  onSelect: (generation: Generation) => void;
  onRefresh?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ generations, onSelect, onRefresh }) => {
  console.log('Sidebar rendering with generations:', generations);
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-200">History</h2>
        {onRefresh && (
          <button onClick={onRefresh} className="text-xs text-gray-400 hover:text-white">
            Refresh
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {generations.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-4">No generations yet.</p>
        ) : (
          generations.map((gen) => (
            <button
              key={gen.id}
              onClick={() => onSelect(gen)}
              className="w-full text-left p-3 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded ${gen.type === 'video' ? 'bg-indigo-900/50 text-indigo-300' : 'bg-purple-900/50 text-purple-300'}`}>
                  {gen.type === 'video' ? 'Video' : 'Image'}
                </span>
                <span className="text-[10px] text-gray-500">
                  {new Date(gen.timestamp).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                {gen.title}
              </h3>
              <p className="text-xs text-gray-500 truncate mt-1">
                {gen.prompt}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
