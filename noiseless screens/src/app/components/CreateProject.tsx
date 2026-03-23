import { useState } from 'react';
import { X, Sparkles, Layers, Film, Image, FileText, Video, Clock } from 'lucide-react';
import type { ProjectType } from './ProjectsView';

interface CreateProjectProps {
  onCancel: () => void;
  onCreate: (data: { 
    type: ProjectType; 
    name: string; 
    description: string; 
    prompt: string;
    startDate: string;
    endDate: string;
  }) => void;
}

const projectTypes = [
  { id: 'carousels' as ProjectType, label: 'Carousels', icon: Layers, color: 'from-blue-500 to-cyan-500', description: 'Multiple slides with visual content' },
  { id: 'storyboard' as ProjectType, label: 'Storyboard', icon: Film, color: 'from-purple-500 to-pink-500', description: 'Visual planning sequence' },
  { id: 'social-media' as ProjectType, label: 'Social Media Post', icon: Image, color: 'from-pink-500 to-rose-500', description: 'Image with text overlay' },
  { id: 'text-only' as ProjectType, label: 'Text Only', icon: FileText, color: 'from-amber-500 to-orange-500', description: 'Pure text content' },
  { id: 'short-videos' as ProjectType, label: 'Short Videos', icon: Video, color: 'from-green-500 to-emerald-500', description: '15-60 second videos' },
  { id: 'long-videos' as ProjectType, label: 'Long Videos', icon: Clock, color: 'from-indigo-500 to-purple-500', description: 'Extended video content' }
];

export function CreateProject({ onCancel, onCreate }: CreateProjectProps) {
  const [step, setStep] = useState<'type' | 'details'>('type');
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const handleTypeSelect = (type: ProjectType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleCreate = () => {
    if (selectedType && name && prompt && startDate && endDate) {
      onCreate({ type: selectedType, name, description, prompt, startDate, endDate });
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
      <div className="w-full max-w-3xl bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl text-white mb-1">Create New Project</h2>
            <p className="text-sm text-white/50">
              {step === 'type' ? 'Select a project type to get started' : 'Add project details'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'type' ? (
            /* Type Selection */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {projectTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-medium mb-1">{type.label}</h3>
                    <p className="text-xs text-white/40">{type.description}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Details Form */
            <div className="space-y-6">
              {/* Selected Type Badge */}
              {selectedType && (
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  {projectTypes.map(type => {
                    if (type.id === selectedType) {
                      const Icon = type.icon;
                      return (
                        <div key={type.id} className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${type.color}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{type.label}</p>
                            <p className="text-xs text-white/40">{type.description}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => setStep('type')}
                    className="text-xs text-white/50 hover:text-white transition-colors"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Project Name */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Project Name *</label>
                <input
                  type="text"
                  placeholder="My Awesome Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Description (Optional)</label>
                <textarea
                  placeholder="Brief description of your project..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
              </div>

              {/* Main Prompt */}
              <div>
                <label className="block text-sm text-white/70 mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Main Prompt *</span>
                  </div>
                </label>
                <textarea
                  placeholder="Describe what you want to create. AI will generate segments based on this prompt..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all resize-none"
                />
                <p className="text-xs text-white/40 mt-2">
                  This prompt will be used to automatically generate project segments
                </p>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Target End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/20 transition-all"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('type')}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!name || !prompt || !startDate || !endDate}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Create Project
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}