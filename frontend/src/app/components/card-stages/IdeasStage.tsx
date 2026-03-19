import { useState } from 'react';
import { Plus, X, Link as LinkIcon } from 'lucide-react';
import type { VideoCardFull, CardLink } from '../VideoCardModal';

interface IdeaNote {
  id: string;
  text: string;
  color: string;
}

const stickyColors = [
  { id: '0', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-200', hover: 'hover:bg-yellow-500/30' },
  { id: '1', bg: 'bg-green-500/20',  border: 'border-green-500/30',  text: 'text-green-200',  hover: 'hover:bg-green-500/30'  },
  { id: '2', bg: 'bg-blue-500/20',   border: 'border-blue-500/30',   text: 'text-blue-200',   hover: 'hover:bg-blue-500/30'   },
  { id: '3', bg: 'bg-pink-500/20',   border: 'border-pink-500/30',   text: 'text-pink-200',   hover: 'hover:bg-pink-500/30'   },
  { id: '4', bg: 'bg-purple-500/20', border: 'border-purple-500/30', text: 'text-purple-200', hover: 'hover:bg-purple-500/30' },
  { id: '5', bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-200', hover: 'hover:bg-orange-500/30' },
  { id: '6', bg: 'bg-cyan-500/20',   border: 'border-cyan-500/30',   text: 'text-cyan-200',   hover: 'hover:bg-cyan-500/30'   },
];

function parseNotes(raw: string | undefined): IdeaNote[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

interface IdeasStageProps {
  card: VideoCardFull;
  onUpdate: () => void;
}

export function IdeasStage({ card, onUpdate }: IdeasStageProps) {
  const [notes, setNotes] = useState<IdeaNote[]>(() => parseNotes(card.ideas_notes));
  const [links, setLinks] = useState<CardLink[]>(card.links || []);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);

  const saveNotes = async (updated: IdeaNote[]) => {
    await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas_notes: JSON.stringify(updated) }),
    });
  };

  const addNote = () => {
    const colorIndex = (notes.length % stickyColors.length).toString();
    const newNote: IdeaNote = { id: Date.now().toString(), text: 'New idea', color: colorIndex };
    const updated = [...notes, newNote];
    setNotes(updated);
    saveNotes(updated);
  };

  const updateNote = (id: string, text: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, text } : n);
    setNotes(updated);
    saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
  };

  const addLink = async () => {
    if (!linkUrl.trim()) return;
    const res = await fetch(`/api/cards/${card.id}/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: linkUrl.trim(), title: linkTitle.trim() }),
    });
    const newLink = await res.json();
    setLinks(prev => [...prev, newLink]);
    setLinkUrl('');
    setLinkTitle('');
    setShowLinkForm(false);
  };

  const deleteLink = async (linkId: number) => {
    await fetch(`/api/cards/links/${linkId}`, { method: 'DELETE' });
    setLinks(prev => prev.filter(l => l.id !== linkId));
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-light text-white mb-1">Ideas</h2>
            <p className="text-sm text-white/40">{notes.length} note{notes.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={addNote}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            Add idea
          </button>
        </div>

        {/* Sticky notes grid */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          {notes.map(note => {
            const colorIdx = parseInt(note.color) % stickyColors.length;
            const colors = stickyColors[colorIdx];
            return (
              <div
                key={note.id}
                className={`relative group ${colors.bg} ${colors.hover} border ${colors.border} rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all min-h-[180px] flex flex-col backdrop-blur-sm`}
              >
                <textarea
                  value={note.text}
                  onChange={e => {
                    const updated = notes.map(n => n.id === note.id ? { ...n, text: e.target.value } : n);
                    setNotes(updated);
                  }}
                  onBlur={e => updateNote(note.id, e.target.value)}
                  className={`${colors.text} flex-1 bg-transparent resize-none focus:outline-none text-base font-normal leading-snug w-full`}
                  placeholder="Write your idea..."
                />
                <button
                  onClick={() => deleteNote(note.id)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full"
                >
                  <X className="w-3 h-3 text-white/60" />
                </button>
              </div>
            );
          })}

          {/* Add idea placeholder */}
          <button
            onClick={addNote}
            className="border-2 border-dashed border-white/10 rounded-2xl p-5 min-h-[180px] flex flex-col items-center justify-center hover:border-white/20 hover:bg-white/5 transition-all group"
          >
            <Plus className="w-8 h-8 text-white/30 group-hover:text-white/60 mb-2 transition-colors" />
            <span className="text-white/40 group-hover:text-white/60 font-medium text-sm transition-colors">Add idea</span>
          </button>
        </div>

        {/* Links section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">References & Links</h3>
            <button
              onClick={() => setShowLinkForm(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-all"
            >
              <Plus className="w-3 h-3" />
              Add link
            </button>
          </div>

          {/* Add link form */}
          {showLinkForm && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-4 space-y-3">
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addLink()}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label (optional)"
                  value={linkTitle}
                  onChange={e => setLinkTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/30"
                />
                <button
                  onClick={addLink}
                  disabled={!linkUrl.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white text-sm font-medium disabled:opacity-40 transition-all"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Links list */}
          {links.length > 0 ? (
            <div className="space-y-2">
              {links.map(link => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-all"
                >
                  <LinkIcon className="w-4 h-4 text-white/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {link.title && <p className="text-sm text-white/90 truncate">{link.title}</p>}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                    >
                      {link.url}
                    </a>
                  </div>
                  <button
                    onClick={() => deleteLink(link.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-white/50" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/30 text-center py-6">No links yet. Add references, articles, or inspiration.</p>
          )}
        </div>
      </div>
    </div>
  );
}
