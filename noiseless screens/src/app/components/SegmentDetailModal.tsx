import { X, Plus, Lightbulb, FileText, Film, Video, Eye, CheckCircle, Calendar } from 'lucide-react';
import { useState } from 'react';
import type { VideoSegment, ProjectType } from './ProjectsView';
import { ScriptEditor } from './ScriptEditor';
import { StoryboardEditor } from './StoryboardEditor';
import { PreviewPlayer } from './PreviewPlayer';

interface SegmentDetailModalProps {
  segment: VideoSegment;
  projectName: string;
  projectType: ProjectType;
  startDate: string;
  endDate: string;
  status: 'on-time' | 'delayed' | 'ready';
  onClose: () => void;
}

interface Idea {
  id: string;
  title: string;
  color: string;
}

const workflowStages = [
  { id: 'ideas', label: 'Ideas', icon: Lightbulb, color: 'from-yellow-500 to-amber-500' },
  { id: 'script', label: 'Script', icon: FileText, color: 'from-blue-500 to-cyan-500' },
  { id: 'storyboard', label: 'Storyboard', icon: Film, color: 'from-purple-500 to-pink-500' },
  { id: 'review', label: 'Review', icon: Eye, color: 'from-orange-500 to-red-500' },
  { id: 'published', label: 'Published', icon: CheckCircle, color: 'from-indigo-500 to-purple-500' }
];

const stickyColors = [
  { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200', hover: 'hover:bg-yellow-500/30' },
  { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-200', hover: 'hover:bg-green-500/30' },
  { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-200', hover: 'hover:bg-blue-500/30' },
  { bg: 'bg-pink-500/20', border: 'border-pink-500/30', text: 'text-pink-200', hover: 'hover:bg-pink-500/30' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200', hover: 'hover:bg-purple-500/30' },
  { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200', hover: 'hover:bg-orange-500/30' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', text: 'text-cyan-200', hover: 'hover:bg-cyan-500/30' }
];

export function SegmentDetailModal({ 
  segment, 
  projectName, 
  projectType,
  startDate, 
  endDate, 
  status, 
  onClose 
}: SegmentDetailModalProps) {
  const [selectedStage, setSelectedStage] = useState(segment.status);
  const [ideas, setIdeas] = useState<Idea[]>([
    { id: '1', title: "Prisoner's Dilemma video", color: '0' },
    { id: '2', title: 'Naval: Pain of Growth', color: '1' },
    { id: '3', title: 'Respect paradox', color: '2' },
    { id: '4', title: 'How to build better habits', color: '3' },
    { id: '5', title: 'Focus in a noisy world', color: '4' },
    { id: '6', title: 'Why most people give up', color: '5' },
    { id: '7', title: 'The power of slow progress', color: '6' }
  ]);

  // Get the index of the current stage to determine which stages are completed
  const currentStageIndex = workflowStages.findIndex(stage => stage.id === segment.status);

  const handleAddIdea = () => {
    const randomColor = Math.floor(Math.random() * stickyColors.length).toString();
    const newIdea: Idea = {
      id: Date.now().toString(),
      title: 'New idea',
      color: randomColor
    };
    setIdeas([...ideas, newIdea]);
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-8 z-[210] flex items-center justify-center">
        <div className="w-full h-full max-w-7xl bg-neutral-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 py-5 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Project</span>
                <span className="text-sm text-white/90">{projectName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs text-white/40">{startDate}</span>
                <span className="text-white/20">→</span>
                <span className="text-xs text-white/40">{endDate || '—'}</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                status === 'on-time' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : status === 'delayed'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {status === 'on-time' ? 'On Time' : status === 'delayed' ? 'Delayed' : 'Ready'}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/30 transition-all">
                Sync
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar - Workflow Stages */}
            <div className="w-64 bg-black/20 backdrop-blur-xl border-r border-white/10 p-6">
              <div className="space-y-2">
                {workflowStages.map((stage, index) => {
                  const Icon = stage.icon;
                  const isSelected = stage.id === selectedStage;
                  const isCompleted = index < currentStageIndex;
                  
                  return (
                    <button
                      key={stage.id}
                      onClick={() => setSelectedStage(stage.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all group ${
                        isSelected
                          ? 'bg-white/10 border border-white/20'
                          : 'border border-transparent hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stage.color} flex items-center justify-center ${
                        !isSelected && 'opacity-60 group-hover:opacity-100'
                      }`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${
                        isSelected ? 'text-white' : 'text-white/60 group-hover:text-white/90'
                      }`}>
                        {stage.label}
                      </span>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content Area */}
            {selectedStage === 'script' ? (
              <ScriptEditor />
            ) : selectedStage === 'storyboard' ? (
              <StoryboardEditor />
            ) : selectedStage === 'published' ? (
              <PreviewPlayer />
            ) : (
              <div className="flex-1 overflow-y-auto p-8">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-3xl font-light text-white mb-1 capitalize">{selectedStage}</h2>
                    <p className="text-sm text-white/40">{ideas.length} ideas</p>
                  </div>
                  <button
                    onClick={handleAddIdea}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add idea
                  </button>
                </div>

                {/* Sticky Notes Grid */}
                <div className="grid grid-cols-4 gap-4">
                  {ideas.map(idea => {
                    const colorIndex = parseInt(idea.color);
                    const colors = stickyColors[colorIndex];
                    
                    return (
                      <div
                        key={idea.id}
                        className={`${colors.bg} ${colors.hover} border ${colors.border} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all cursor-pointer min-h-[180px] flex flex-col backdrop-blur-sm`}
                      >
                        <h3 className={`${colors.text} font-normal text-base leading-snug flex-1`}>
                          {idea.title}
                        </h3>
                        <div className={`mt-4 pt-3 border-t ${colors.border}`}>
                          <div className="h-2"></div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Idea Card */}
                  <button
                    onClick={handleAddIdea}
                    className="border-2 border-dashed border-white/10 rounded-2xl p-5 min-h-[180px] flex flex-col items-center justify-center hover:border-white/20 hover:bg-white/5 transition-all group"
                  >
                    <Plus className="w-8 h-8 text-white/30 group-hover:text-white/60 mb-2 transition-colors" />
                    <span className="text-white/40 group-hover:text-white/60 font-medium text-sm transition-colors">Add idea</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}