import { useState, useRef } from 'react';
import { Sparkles, Send, Video, Image, Film, Layers, Upload, X, Loader2, Download, RotateCcw } from 'lucide-react';

interface Settings {
  videoModel: string;
  imageModel: string;
  aspectRatio: string;
  resolution: string;
  generateSound: boolean;
  duration: string;
}

interface MainContentProps {
  prompt: string;
  setPrompt: (value: string) => void;
  creationType: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video' | null;
  onCreationTypeSelect: (type: 'text-to-video' | 'text-to-image' | 'frames-to-video' | 'references-to-video') => void;
  settings: Settings;
}

interface GenResult {
  type: 'image' | 'video';
  url: string;
  mimeType: string;
}

interface UploadedFile {
  file: File;
  preview: string;
}

const STYLE_TAGS = [
  'Photorealistic', 'Cinematic', 'Anime', 'Cyberpunk', 'Fantasy',
  'Watercolor', 'Oil Painting', 'Neon Noir', 'Vintage', 'Sketch',
];

export function MainContent({ prompt, setPrompt, creationType, onCreationTypeSelect, settings }: MainContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const [startFrame, setStartFrame] = useState<UploadedFile | null>(null);
  const [endFrame, setEndFrame] = useState<UploadedFile | null>(null);
  const [references, setReferences] = useState<UploadedFile[]>([]);

  const startFrameRef = useRef<HTMLInputElement>(null);
  const endFrameRef = useRef<HTMLInputElement>(null);
  const referencesRef = useRef<HTMLInputElement>(null);

  const creationTypes = [
    { id: 'text-to-video', label: 'Text to Video', icon: Video },
    { id: 'text-to-image', label: 'Text to Image', icon: Image },
    { id: 'frames-to-video', label: 'Frames to Video', icon: Film },
    { id: 'references-to-video', label: 'References to Video', icon: Layers },
  ] as const;

  function addUploadedFile(file: File): UploadedFile {
    return { file, preview: URL.createObjectURL(file) };
  }

  function handleStartFrame(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setStartFrame(addUploadedFile(file));
  }

  function handleEndFrame(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setEndFrame(addUploadedFile(file));
  }

  function handleReferences(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setReferences(prev => [...prev, ...files.map(addUploadedFile)]);
  }

  function removeReference(idx: number) {
    setReferences(prev => prev.filter((_, i) => i !== idx));
  }

  function applyStyleTag(tag: string) {
    setPrompt(prompt.trim() ? `${prompt.trim()}, ${tag}` : tag);
  }

  async function enhance() {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: creationType || 'text-to-video' }),
      });
      let data: any;
      try { data = await res.json(); } catch { throw new Error('Server returned an invalid response'); }
      if (!res.ok) throw new Error(data?.error || 'Enhancement failed');
      if (!data?.enhanced) throw new Error('No enhanced prompt returned');
      setOriginalPrompt(prompt);
      setPrompt(data.enhanced);
    } catch (err: any) {
      setError(err.message || 'Enhancement failed');
    } finally {
      setIsEnhancing(false);
    }
  }

  function revertPrompt() {
    if (originalPrompt !== null) {
      setPrompt(originalPrompt);
      setOriginalPrompt(null);
    }
  }

  const canGenerate = (() => {
    if (!prompt.trim()) return false;
    if (creationType === 'frames-to-video') return !!startFrame;
    return true;
  })();

  async function generate() {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('prompt', prompt);
    fd.append('type', creationType || 'text-to-video');
    fd.append('videoModel', settings.videoModel);
    fd.append('imageModel', settings.imageModel);
    fd.append('aspectRatio', settings.aspectRatio);
    fd.append('resolution', settings.resolution);
    fd.append('generateSound', String(settings.generateSound));
    fd.append('duration', settings.duration);

    if (creationType === 'frames-to-video') {
      if (startFrame) fd.append('startFrame', startFrame.file);
      if (endFrame) fd.append('endFrame', endFrame.file);
    } else if (creationType === 'references-to-video' || creationType === 'text-to-image') {
      references.forEach(r => fd.append('references', r.file));
    }

    try {
      const res = await fetch('/api/quick-gen', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }

  const isImage = creationType === 'text-to-image';

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 overflow-y-auto">
      <div className="max-w-3xl w-full space-y-8 py-20">

        {/* Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-6xl tracking-tight bg-gradient-to-br from-white via-white/90 to-white/60 bg-clip-text text-transparent">
            Noiseless Studio
          </h1>
          <p className="text-lg text-white/40 max-w-md mx-auto">
            Create stunning visuals from text descriptions
          </p>
        </div>

        {/* Creation type selector */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {creationTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = creationType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => onCreationTypeSelect(type.id)}
                className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white/90'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Frame uploads for Frames to Video */}
        {creationType === 'frames-to-video' && (
          <div className="grid grid-cols-2 gap-4">
            <FrameUpload
              label="Start Frame"
              file={startFrame}
              inputRef={startFrameRef}
              onChange={handleStartFrame}
              onClear={() => setStartFrame(null)}
              required
            />
            <FrameUpload
              label="End Frame (optional)"
              file={endFrame}
              inputRef={endFrameRef}
              onChange={handleEndFrame}
              onClear={() => setEndFrame(null)}
            />
          </div>
        )}

        {/* Reference images for References to Video / Text to Image */}
        {(creationType === 'references-to-video' || creationType === 'text-to-image') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                {creationType === 'text-to-image' ? 'Reference images (optional)' : 'Reference images'}
              </p>
              <button
                onClick={() => referencesRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 hover:bg-white/10 hover:text-white transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                Add images
              </button>
              <input
                ref={referencesRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleReferences}
              />
            </div>
            {references.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {references.map((ref, i) => (
                  <div key={i} className="relative group">
                    <img src={ref.preview} className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                    <button
                      onClick={() => removeReference(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Prompt input */}
        <div className="space-y-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-2 shadow-2xl">
              <div className="flex items-center gap-3 px-4">
                <input
                  type="text"
                  placeholder={
                    isImage
                      ? 'Describe the image you want to create...'
                      : 'Describe your video in detail...'
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && generate()}
                  className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder:text-white/30 py-4 text-base"
                  disabled={isGenerating}
                />

                {/* Send button */}
                <button
                  onClick={generate}
                  disabled={!canGenerate || isGenerating}
                  className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Send className="w-5 h-5 text-white" />
                  )}
                </button>

                {/* Enhance / Revert button */}
                {originalPrompt !== null ? (
                  <button
                    onClick={revertPrompt}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white/80"
                    title="Revert to original prompt"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={enhance}
                    disabled={!prompt.trim() || isEnhancing || isGenerating}
                    className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-purple-400 hover:text-purple-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Enhance prompt with AI"
                  >
                    {isEnhancing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Style Tags */}
          <div className="flex flex-wrap gap-2 justify-center px-1">
            {STYLE_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => applyStyleTag(tag)}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 hover:bg-purple-500/10 hover:text-white/80 hover:border-purple-500/30 transition-all"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Loading status */}
        {isGenerating && (
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
            <p className="text-white/60 text-sm">
              {isImage ? 'Generating image...' : 'Generating video (this may take a few minutes)...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              {result.type === 'image' ? (
                <img
                  src={result.url}
                  alt="Generated"
                  className="w-full rounded-2xl"
                />
              ) : (
                <video
                  src={result.url}
                  controls
                  autoPlay
                  loop
                  className="w-full rounded-2xl"
                />
              )}
            </div>
            <div className="flex justify-end">
              <a
                href={result.url}
                download
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        )}

        {/* Info */}
        {!result && !isGenerating && !error && (
          <p className="text-xs text-white/25 text-center">
            All resolutions supported • Fast generation • High quality output
          </p>
        )}
      </div>
    </div>
  );
}

// ── Sub-component: FrameUpload ────────────────────────────────────────────────
interface FrameUploadProps {
  label: string;
  file: UploadedFile | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  required?: boolean;
}

function FrameUpload({ label, file, inputRef, onChange, onClear, required }: FrameUploadProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/50">
        {label}{required && <span className="text-pink-400 ml-1">*</span>}
      </p>
      {file ? (
        <div className="relative group rounded-xl overflow-hidden border border-white/10">
          <img src={file.preview} className="w-full h-36 object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-36 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all flex flex-col items-center justify-center gap-2 text-white/40 hover:text-white/60"
        >
          <Upload className="w-6 h-6" />
          <span className="text-xs">Upload image</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
    </div>
  );
}
