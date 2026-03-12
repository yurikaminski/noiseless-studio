import { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Image, Film, FileText, Video, Layers, Clock, Folder } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { CreateProject } from './CreateProject';

export interface VideoSegment {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail?: string;
  status: string; // Changed to string to support different workflows
}

export type ProjectType = 'carousels' | 'storyboard' | 'social-media' | 'text-only' | 'short-videos' | 'long-videos';

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  segments: VideoSegment[];
  createdAt: string;
  startDate: string;
  endDate: string;
  status: 'on-time' | 'delayed' | 'ready';
}

const projectTypes = [
  { id: 'carousels', label: 'Carousels', icon: Layers, color: 'from-blue-500 to-cyan-500' },
  { id: 'storyboard', label: 'Storyboard', icon: Film, color: 'from-purple-500 to-pink-500' },
  { id: 'social-media', label: 'Social Media Post', icon: Image, color: 'from-pink-500 to-rose-500' },
  { id: 'text-only', label: 'Text Only', icon: FileText, color: 'from-amber-500 to-orange-500' },
  { id: 'short-videos', label: 'Short Videos', icon: Video, color: 'from-green-500 to-emerald-500' },
  { id: 'long-videos', label: 'Long Videos', icon: Clock, color: 'from-indigo-500 to-purple-500' }
];

// Workflow definitions for each project type
const workflows: Record<ProjectType, Array<{ id: string; title: string; color: string }>> = {
  'short-videos': [
    { id: 'ideas', title: 'Ideas', color: 'text-purple-400' },
    { id: 'script', title: 'Script', color: 'text-blue-400' },
    { id: 'storyboard', title: 'Storyboard', color: 'text-cyan-400' },
    { id: 'scenes', title: 'Scenes', color: 'text-yellow-400' },
    { id: 'final-edition', title: 'Final Edition', color: 'text-orange-400' },
    { id: 'ready', title: 'Ready', color: 'text-green-400' }
  ],
  'long-videos': [
    { id: 'ideas', title: 'Ideas', color: 'text-purple-400' },
    { id: 'script', title: 'Script', color: 'text-blue-400' },
    { id: 'storyboard', title: 'Storyboard', color: 'text-cyan-400' },
    { id: 'scenes', title: 'Scenes', color: 'text-yellow-400' },
    { id: 'final-edition', title: 'Final Edition', color: 'text-orange-400' },
    { id: 'ready', title: 'Ready', color: 'text-green-400' }
  ],
  'carousels': [
    { id: 'concept', title: 'Concept', color: 'text-purple-400' },
    { id: 'design', title: 'Design', color: 'text-blue-400' },
    { id: 'content', title: 'Content', color: 'text-cyan-400' },
    { id: 'review', title: 'Review', color: 'text-yellow-400' },
    { id: 'ready', title: 'Ready', color: 'text-green-400' }
  ],
  'storyboard': [
    { id: 'planning', title: 'Planning', color: 'text-purple-400' },
    { id: 'sketches', title: 'Sketches', color: 'text-blue-400' },
    { id: 'refinement', title: 'Refinement', color: 'text-cyan-400' },
    { id: 'final', title: 'Final', color: 'text-green-400' }
  ],
  'social-media': [
    { id: 'concept', title: 'Concept', color: 'text-purple-400' },
    { id: 'design', title: 'Design', color: 'text-blue-400' },
    { id: 'copy', title: 'Copy', color: 'text-cyan-400' },
    { id: 'review', title: 'Review', color: 'text-yellow-400' },
    { id: 'ready', title: 'Ready', color: 'text-green-400' }
  ],
  'text-only': [
    { id: 'draft', title: 'Draft', color: 'text-purple-400' },
    { id: 'editing', title: 'Editing', color: 'text-blue-400' },
    { id: 'review', title: 'Review', color: 'text-yellow-400' },
    { id: 'ready', title: 'Ready', color: 'text-green-400' }
  ]
};

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Product Launch Video',
      description: 'Complete promotional video for Q1 product launch',
      type: 'long-videos',
      createdAt: '2/20/2026',
      startDate: '2/15/2026',
      endDate: '3/15/2026',
      status: 'on-time',
      segments: [
        {
          id: 's1',
          title: 'Opening Scene',
          description: 'Dynamic logo reveal with particles',
          duration: '5s',
          status: 'ready'
        },
        {
          id: 's2',
          title: 'Product Showcase',
          description: '360 degree product rotation',
          duration: '10s',
          status: 'final-edition'
        },
        {
          id: 's3',
          title: 'Features Overview',
          description: 'Highlight key product features',
          duration: '15s',
          status: 'scenes'
        },
        {
          id: 's4',
          title: 'Call to Action',
          description: 'Final CTA with website',
          duration: '5s',
          status: 'ideas'
        }
      ]
    },
    {
      id: '2',
      name: 'Instagram Stories',
      description: 'Series of stories for Instagram',
      type: 'short-videos',
      createdAt: '2/22/2026',
      startDate: '2/20/2026',
      endDate: '2/25/2026',
      status: 'ready',
      segments: [
        {
          id: 's5',
          title: 'Teaser #1',
          description: 'Behind the scenes footage',
          duration: '7s',
          status: 'ideas'
        },
        {
          id: 's6',
          title: 'Teaser #2',
          description: 'Customer testimonial',
          duration: '8s',
          status: 'script'
        }
      ]
    }
  ]);

  const [selectedType, setSelectedType] = useState<ProjectType | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'kanban' | 'create'>('grid');

  const filteredProjects = selectedType === 'all' 
    ? projects 
    : projects.filter(p => p.type === selectedType);

  const selectedProjectData = projects.find(p => p.id === selectedProject);

  const moveSegment = (segmentId: string, newStatus: string) => {
    setProjects(projects.map(project => {
      if (project.id === selectedProject) {
        return {
          ...project,
          segments: project.segments.map(seg => 
            seg.id === segmentId ? { ...seg, status: newStatus } : seg
          )
        };
      }
      return project;
    }));
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    setView('kanban');
  };

  const handleCreateProject = (data: {
    type: ProjectType;
    name: string;
    description: string;
    prompt: string;
    startDate: string;
    endDate: string;
  }) => {
    // Get the first status from the workflow for this project type
    const workflow = workflows[data.type];
    const initialStatus = workflow[0].id;

    // Create new project with AI-generated segments (mock for now)
    const newProject: Project = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      type: data.type,
      createdAt: new Date().toLocaleDateString(),
      startDate: data.startDate,
      endDate: data.endDate,
      status: 'on-time',
      segments: [
        {
          id: `seg-${Date.now()}-1`,
          title: 'Segment 1',
          description: data.prompt.substring(0, 50) + '...',
          duration: '10s',
          status: initialStatus
        }
      ]
    };
    
    setProjects([...projects, newProject]);
    setSelectedProject(newProject.id);
    setView('kanban');
  };

  // Kanban View
  if (view === 'kanban' && selectedProjectData) {
    const columns = workflows[selectedProjectData.type];

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex-1 flex flex-col relative z-10 pt-24 px-8 pb-8">
          {/* Back button */}
          <button
            onClick={() => setView('grid')}
            className="mb-6 text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Projects
          </button>

          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {projectTypes.map(type => {
                if (type.id === selectedProjectData.type) {
                  const Icon = type.icon;
                  return (
                    <div key={type.id} className={`p-2 rounded-xl bg-gradient-to-br ${type.color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  );
                }
                return null;
              })}
              <div>
                <h2 className="text-2xl text-white">{selectedProjectData.name}</h2>
                <p className="text-sm text-white/50">{selectedProjectData.description}</p>
              </div>
            </div>
          </div>

          {/* Kanban Columns */}
          <div className="flex-1 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map(column => {
              const segments = selectedProjectData.segments.filter(
                seg => seg.status === column.id
              );
              
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  segments={segments}
                  onMove={moveSegment}
                />
              );
            })}
          </div>
        </div>
      </DndProvider>
    );
  }

  // Grid View (Projects List)
  return (
    <div className="flex-1 flex flex-col relative z-10 pt-24 px-8 pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-white mb-2">Projects</h1>
          <p className="text-white/50 text-sm">Organize your content with project workflows</p>
        </div>
        <button
          onClick={() => setView('create')}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Project
        </button>
      </div>

      {/* Type Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
            selectedType === 'all'
              ? 'bg-white/10 text-white'
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          All Projects
        </button>
        {projectTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedType === type.id
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <Folder className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl text-white/70 mb-2">No projects yet</h3>
            <p className="text-white/40 mb-6">Create your first project to get started</p>
            <button
              onClick={() => setView('create')}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => {
            const projectType = projectTypes.find(t => t.id === project.type);
            const Icon = projectType?.icon || Folder;
            
            return (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                {/* Project Icon & Type */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${projectType?.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{project.name}</h3>
                    <p className="text-xs text-white/40">{projectType?.label}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-white/50 mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Dates */}
                <div className="flex items-center gap-3 mb-3 text-xs">
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{project.startDate}</span>
                  </div>
                  <span className="text-white/20">→</span>
                  <div className="flex items-center gap-1.5 text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{project.endDate}</span>
                  </div>
                </div>

                {/* Stats & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Video className="w-3.5 h-3.5" />
                    <span>{project.segments.length} segments</span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    project.status === 'on-time' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : project.status === 'delayed'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {project.status === 'on-time' ? 'On Time' : project.status === 'delayed' ? 'Delayed' : 'Ready'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {view === 'create' && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={() => setView('grid')}
          />
          <CreateProject
            onCancel={() => setView('grid')}
            onCreate={handleCreateProject}
          />
        </>
      )}
    </div>
  );
}