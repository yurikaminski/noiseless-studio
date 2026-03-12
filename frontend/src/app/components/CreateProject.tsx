import { useState, useRef } from 'react';
import { X, Sparkles, Layers, Film, Image, FileText, Video, Clock, Upload, Link2, Table2 } from 'lucide-react';
import type { ProjectType } from './ProjectsView';

interface CreateProjectProps {
  onCancel: () => void;
  onCreate: (data: any) => void;
}

type Step = 'mode' | 'import' | 'type' | 'details';
type ImportTab = 'local' | 'sheets';

const projectTypes = [
  { id: 'carousels' as ProjectType, label: 'Carousels', icon: Layers, color: 'from-blue-500 to-cyan-500', description: 'Multiple slides with visual content' },
  { id: 'storyboard' as ProjectType, label: 'Storyboard', icon: Film, color: 'from-purple-500 to-pink-500', description: 'Visual planning sequence' },
  { id: 'social-media' as ProjectType, label: 'Social Media Post', icon: Image, color: 'from-pink-500 to-rose-500', description: 'Image with text overlay' },
  { id: 'text-only' as ProjectType, label: 'Text Only', icon: FileText, color: 'from-amber-500 to-orange-500', description: 'Pure text content' },
  { id: 'short-videos' as ProjectType, label: 'Short Videos', icon: Video, color: 'from-green-500 to-emerald-500', description: '15-60 second videos' },
  { id: 'long-videos' as ProjectType, label: 'Long Videos', icon: Clock, color: 'from-indigo-500 to-purple-500', description: 'Extended video content' },
];

export function CreateProject({ onCancel, onCreate }: CreateProjectProps) {
  const [step, setStep] = useState<Step>('mode');
  const [importTab, setImportTab] = useState<ImportTab>('local');
  const [selectedType, setSelectedType] = useState<ProjectType | null>(null);

  // Manual form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Import form
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [driveFolderUrl, setDriveFolderUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('5');
  const [videoResolution, setVideoResolution] = useState('1080p');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleTypeSelect = (type: ProjectType) => {
    setSelectedType(type);
    setStep('details');
  };

  const handleManualCreate = () => {
    if (selectedType && name) {
      onCreate({ type: selectedType, name, description, prompt: '', startDate: '', endDate: '' });
    }
  };

  const handleImport = async () => {
    if (!importName) return;
    setImporting(true);
    try {
      if (importTab === 'local' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('name', importName);
        formData.append('description', importDescription);
        if (driveFolderUrl) formData.append('drive_parent_folder_id', driveFolderUrl);
        formData.append('video_duration', videoDuration);
        formData.append('video_resolution', videoResolution);
        const res = await fetch('/api/projects/import/local', { method: 'POST', body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Import failed');
        onCreate({ _importId: json.id, name: importName });
      } else if (importTab === 'sheets' && sheetsUrl) {
        const res = await fetch('/api/projects/import/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: importName,
            description: importDescription,
            sheets_url: sheetsUrl,
            drive_parent_folder_id: driveFolderUrl || undefined,
            video_duration: videoDuration,
            video_resolution: videoResolution,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Import failed');
        onCreate({ _importId: json.id, name: importName });
      }
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const stepTitle: Record<Step, string> = {
    mode: 'Create New Project',
    import: 'Import Spreadsheet',
    type: 'Select Project Type',
    details: 'Project Details',
  };

  const stepSubtitle: Record<Step, string> = {
    mode: 'Choose how to create your project',
    import: 'Import scenes from a spreadsheet',
    type: 'Select a project type to get started',
    details: 'Add project details',
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
      <div className="w-full max-w-3xl bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-2xl text-white mb-1">{stepTitle[step]}</h2>
            <p className="text-sm text-white/50">{stepSubtitle[step]}</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {/* ── Mode Selection ── */}
          {step === 'mode' && (
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setStep('type')}
                className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-2">Manual Project</h3>
                <p className="text-xs text-white/40">Create a project with a kanban workflow for carousels, videos, and more</p>
              </button>
              <button
                onClick={() => setStep('import')}
                className="group p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center mb-4">
                  <Table2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-white font-medium mb-2">Import Spreadsheet</h3>
                <p className="text-xs text-white/40">Import scenes from a .xlsx, .csv file or Google Sheets URL</p>
              </button>
            </div>
          )}

          {/* ── Import Spreadsheet ── */}
          {step === 'import' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-white/70 mb-2">Project Name *</label>
                <input
                  type="text"
                  placeholder="My Spreadsheet Project"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm text-white/70 mb-2">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  value={importDescription}
                  onChange={(e) => setImportDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Source Tabs */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Spreadsheet Source</label>
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-4">
                  <button
                    onClick={() => setImportTab('local')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${importTab === 'local' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
                  >
                    Local File
                  </button>
                  <button
                    onClick={() => setImportTab('sheets')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${importTab === 'sheets' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
                  >
                    Google Sheets
                  </button>
                </div>

                {importTab === 'local' ? (
                  <div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 transition-colors flex flex-col items-center gap-2"
                    >
                      <Upload className="w-8 h-8 text-white/30" />
                      {selectedFile ? (
                        <span className="text-sm text-white/70">{selectedFile.name}</span>
                      ) : (
                        <>
                          <span className="text-sm text-white/50">Click to select file</span>
                          <span className="text-xs text-white/30">.xlsx, .xls, .csv</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                      <Link2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                      <input
                        type="url"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        value={sheetsUrl}
                        onChange={(e) => setSheetsUrl(e.target.value)}
                        className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-2">Make sure the sheet is accessible to your connected Google account</p>
                  </div>
                )}
              </div>

              {/* Drive Folder */}
              <div>
                <label className="block text-sm text-white/70 mb-2">Google Drive Folder (Optional)</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <Link2 className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={driveFolderUrl}
                    onChange={(e) => setDriveFolderUrl(e.target.value)}
                    className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-white/30 mt-2">Scene subfolders will be created inside this folder</p>
              </div>

              {/* Video Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">Video Duration</label>
                  <select
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-all"
                  >
                    <option value="5">5 seconds</option>
                    <option value="8">8 seconds</option>
                    <option value="10">10 seconds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">Resolution</label>
                  <select
                    value={videoResolution}
                    onChange={(e) => setVideoResolution(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/20 transition-all"
                  >
                    <option value="720p">720p (HD)</option>
                    <option value="1080p">1080p (Full HD)</option>
                    <option value="4k">4K (Ultra HD)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('mode')}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importName || (importTab === 'local' ? !selectedFile : !sheetsUrl) || importing}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-teal-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  {importing ? 'Importing...' : 'Import'}
                </button>
              </div>
            </div>
          )}

          {/* ── Type Selection ── */}
          {step === 'type' && (
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
          )}

          {/* ── Details Form ── */}
          {step === 'details' && (
            <div className="space-y-6">
              {selectedType && (
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  {projectTypes.map(type => {
                    if (type.id !== selectedType) return null;
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
                  })}
                  <button onClick={() => setStep('type')} className="text-xs text-white/50 hover:text-white transition-colors">
                    Change
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm text-white/70 mb-2">Project Name *</label>
                <input
                  type="text"
                  placeholder="My Awesome Project"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

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

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('type')}
                  className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleManualCreate}
                  disabled={!name}
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
