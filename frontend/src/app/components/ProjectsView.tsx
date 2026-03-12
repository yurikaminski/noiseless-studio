import { useState, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Image, Film, FileText, Video, Layers, Clock, Folder, Table2 } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { CreateProject } from './CreateProject';
import { SceneTable } from './SceneTable';

export interface VideoSegment {
  id: string;
  title: string;
  description: string;
  duration: string;
  thumbnail?: string;
  status: string;
}

export type ProjectType = 'carousels' | 'storyboard' | 'social-media' | 'text-only' | 'short-videos' | 'long-videos' | 'spreadsheet';

export interface Project {
  id: string | number;
  name: string;
  description: string;
  type: ProjectType;
  segments: VideoSegment[];
  createdAt: string;
  startDate?: string;
  endDate?: string;
  status: 'on-time' | 'delayed' | 'ready';
  drive_parent_folder_id?: string;
  spreadsheet_source?: string;
}

const projectTypes = [
  { id: 'carousels', label: 'Carousels', icon: Layers, color: 'from-blue-500 to-cyan-500' },
  { id: 'storyboard', label: 'Storyboard', icon: Film, color: 'from-purple-500 to-pink-500' },
  { id: 'social-media', label: 'Social Media Post', icon: Image, color: 'from-pink-500 to-rose-500' },
  { id: 'text-only', label: 'Text Only', icon: FileText, color: 'from-amber-500 to-orange-500' },
  { id: 'short-videos', label: 'Short Videos', icon: Video, color: 'from-green-500 to-emerald-500' },
  { id: 'long-videos', label: 'Long Videos', icon: Clock, color: 'from-indigo-500 to-purple-500' },
  { id: 'spreadsheet', label: 'Spreadsheet', icon: Table2, color: 'from-teal-500 to-emerald-500' },
];

const workflows: Record<string, Array<{ id: string; title: string; color: string }>> = {
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedType, setSelectedType] = useState<ProjectType | 'all'>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [view, setView] = useState<'grid' | 'kanban' | 'scenes' | 'create'>('grid');
  const [loading, setLoading] = useState(true);

  const loadProjects = () => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: any[]) => {
        setProjects(data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          type: (p.type || 'spreadsheet') as ProjectType,
          segments: [],
          createdAt: new Date(p.created_at).toLocaleDateString(),
          status: 'on-time' as const,
          drive_parent_folder_id: p.drive_parent_folder_id,
          spreadsheet_source: p.spreadsheet_source,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProjects(); }, []);

  const filteredProjects = selectedType === 'all'
    ? projects
    : projects.filter(p => p.type === selectedType);

  const moveSegment = (segmentId: string, newStatus: string) => {
    if (!selectedProject) return;
    setSelectedProject({
      ...selectedProject,
      segments: selectedProject.segments.map(s =>
        s.id === segmentId ? { ...s, status: newStatus } : s
      ),
    });
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setView(project.type === 'spreadsheet' ? 'scenes' : 'kanban');
  };

  const handleCreateProject = async (data: any) => {
    if (data._importId) {
      loadProjects();
      setView('grid');
      return;
    }
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, type: data.type, description: data.description }),
      });
      loadProjects();
      setView('grid');
    } catch {
      alert('Failed to create project');
    }
  };

  // ── Scenes view ──
  if (view === 'scenes' && selectedProject) {
    return (
      <div className="flex-1 flex flex-col relative z-10 pt-24 px-8 pb-8">
        <button
          onClick={() => setView('grid')}
          className="mb-6 text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Projects
        </button>
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500">
            <Table2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl text-white">{selectedProject.name}</h2>
            <p className="text-sm text-white/50">{selectedProject.description}</p>
          </div>
        </div>
        <SceneTable projectId={Number(selectedProject.id)} />
      </div>
    );
  }

  // ── Kanban view ──
  if (view === 'kanban' && selectedProject) {
    const columns = workflows[selectedProject.type] || workflows['short-videos'];
    return (
      <DndProvider backend={HTML5Backend}>
        <div className="flex-1 flex flex-col relative z-10 pt-24 px-8 pb-8">
          <button
            onClick={() => setView('grid')}
            className="mb-6 text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
          >
            ← Back to Projects
          </button>
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              {projectTypes.map(type => {
                if (type.id !== selectedProject.type) return null;
                const Icon = type.icon;
                return (
                  <div key={type.id} className={`p-2 rounded-xl bg-gradient-to-br ${type.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                );
              })}
              <div>
                <h2 className="text-2xl text-white">{selectedProject.name}</h2>
                <p className="text-sm text-white/50">{selectedProject.description}</p>
              </div>
            </div>
          </div>
          <div
            className="flex-1 grid gap-4 overflow-hidden"
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                segments={selectedProject.segments.filter(s => s.status === column.id)}
                onMove={moveSegment}
              />
            ))}
          </div>
        </div>
      </DndProvider>
    );
  }

  // ── Grid view ──
  return (
    <div className="flex-1 flex flex-col relative z-10 pt-24 px-8 pb-8">
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
            selectedType === 'all' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          All Projects
        </button>
        {projectTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id as ProjectType)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              selectedType === type.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/40">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
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
                onClick={() => handleProjectClick(project)}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${projectType?.color || 'from-gray-500 to-gray-600'}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{project.name}</h3>
                    <p className="text-xs text-white/40">{projectType?.label || project.type}</p>
                  </div>
                </div>
                <p className="text-sm text-white/50 mb-4 line-clamp-2">{project.description || 'No description'}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{project.createdAt}</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    {project.type === 'spreadsheet' ? 'Spreadsheet' : 'On Time'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
