import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Video, Image, Upload, X, Loader2, Download, RotateCcw } from 'lucide-react';
import { apiFetch } from '../lib/api';

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

type VideoSubMode = 'text-to-video' | 'frames-to-video' | 'references-to-video';

export function MainContent({ prompt, setPrompt, creationType, onCreationTypeSelect, settings }: MainContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenResult | null>(null);
  const [startFrame, setStartFrame] = useState<UploadedFile | null>(null);
  const [endFrame, setEndFrame] = useState<UploadedFile | null>(null);
  const [references, setReferences] = useState<UploadedFile[]>([]);
  const [videoSubMode, setVideoSubMode] = useState<VideoSubMode>('text-to-video');

  const startFrameRef = useRef<HTMLInputElement>(null);
  const endFrameRef = useRef<HTMLInputElement>(null);
  const referencesRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
  }, [prompt]);

  // Derived state
  const primaryMode = creationType === 'text-to-image' ? 'image' : (creationType !== null ? 'video' : null);
  const effectiveCreationType = primaryMode === 'image' ? 'text-to-image' : videoSubMode;
  const isImage = effectiveCreationType === 'text-to-image';

  function selectPrimaryMode(mode: 'image' | 'video') {
    if (mode === 'image') {
      onCreationTypeSelect('text-to-image');
    } else {
      setVideoSubMode('text-to-video');
      onCreationTypeSelect('text-to-video');
    }
  }

  function selectVideoSubMode(sub: VideoSubMode) {
    if (sub === 'frames-to-video') {
      setReferences([]);
    } else {
      setStartFrame(null);
      setEndFrame(null);
    }
    setVideoSubMode(sub);
    onCreationTypeSelect(sub);
  }

  async function compressImage(file: File, maxSizeKB = 1200): Promise<File> {
    return new Promise((resolve) => {
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        // Scale down if image is very large
        const maxDim = 1920;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        // Try quality steps until under maxSizeKB
        let quality = 0.85;
        const tryEncode = () => {
          canvas.toBlob((blob) => {
            if (!blob) { resolve(file); return; }
            if (blob.size <= maxSizeKB * 1024 || quality <= 0.4) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              quality -= 0.1;
              tryEncode();
            }
          }, 'image/jpeg', quality);
        };
        tryEncode();
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

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
      const res = await apiFetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: effectiveCreationType }),
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
    if (effectiveCreationType === 'frames-to-video') return !!startFrame;
    return true;
  })();

  async function generate() {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('prompt', prompt);
    fd.append('type', effectiveCreationType);
    fd.append('videoModel', settings.videoModel);
    fd.append('imageModel', settings.imageModel);
    fd.append('aspectRatio', settings.aspectRatio);
    fd.append('resolution', settings.resolution);
    fd.append('generateSound', String(settings.generateSound));
    fd.append('duration', settings.duration);

    if (effectiveCreationType === 'frames-to-video') {
      if (startFrame) fd.append('startFrame', await compressImage(startFrame.file));
      if (endFrame) fd.append('endFrame', await compressImage(endFrame.file));
    } else if (effectiveCreationType === 'references-to-video' || effectiveCreationType === 'text-to-image') {
      for (const r of references) fd.append('references', await compressImage(r.file));
    }

    console.log(`[generate] submitting | type=${effectiveCreationType} videoModel=${settings.videoModel} resolution=${settings.resolution} duration=${settings.duration} hasStartFrame=${!!startFrame} hasEndFrame=${!!endFrame}`);

    try {
      const res = await apiFetch('/api/quick-gen', { method: 'POST', body: fd });
      let data: any;
      try { data = await res.json(); } catch { throw new Error(res.ok ? 'Server returned an invalid response' : `Server error ${res.status}: ${res.statusText}`); }
      if (!res.ok) throw new Error(data?.error || 'Generation failed');

      if (data.jobId) {
        console.log(`[generate] job created | jobId=${data.jobId} → starting poll`);
        await pollJobResult(data.jobId);
      } else {
        console.log(`[generate] immediate result | type=${data.type} url=${data.url}`);
        setResult(data);
      }
    } catch (err: any) {
      console.error('[generate] error:', err.message);
      setError(err.message || 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }

  async function pollJobResult(jobId: string) {
    const INTERVAL_MS = 5000;
    const MAX_WAIT_MS = 15 * 60 * 1000;
    const start = Date.now();
    let pollCount = 0;

    while (Date.now() - start < MAX_WAIT_MS) {
      await new Promise(r => setTimeout(r, INTERVAL_MS));
      pollCount++;
      const elapsed = Math.round((Date.now() - start) / 1000);
      const res = await apiFetch(`/api/quick-gen/status/${jobId}`);
      const job = await res.json();
      console.log(`[generate] poll #${pollCount} | jobId=${jobId} status=${job.status} elapsed=${elapsed}s`);

      if (job.status === 'done') {
        console.log(`[generate] done | url=${job.url} elapsed=${elapsed}s`);
        setResult({ type: 'video', url: job.url, mimeType: job.mimeType });
        return;
      }
      if (job.status === 'error') throw new Error(job.error || 'Generation failed');
    }
    throw new Error('A geração demorou mais do que o esperado. Tente novamente.');
  }

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

        {/* Primary mode selector */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {(['image', 'video'] as const).map((mode) => {
              const isSelected = primaryMode === mode;
              const Icon = mode === 'image' ? Image : Video;
              return (
                <button
                  key={mode}
                  onClick={() => selectPrimaryMode(mode)}
                  className={`px-5 py-2.5 rounded-full border transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/50 text-white'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white/90'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm capitalize">{mode}</span>
                </button>
              );
            })}
          </div>

          {/* Video sub-mode row — only shown when Video is selected */}
          {primaryMode === 'video' && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              {([
                { id: 'text-to-video', label: 'From Text' },
                { id: 'frames-to-video', label: 'From Frames' },
                { id: 'references-to-video', label: 'With References' },
              ] as { id: VideoSubMode; label: string }[]).map(({ id, label }) => {
                const isActive = videoSubMode === id;
                const isDisabled =
                  (id === 'frames-to-video' && references.length > 0) ||
                  (id === 'references-to-video' && videoSubMode === 'frames-to-video' && (!!startFrame || !!endFrame));
                return (
                  <button
                    key={id}
                    onClick={() => !isDisabled && selectVideoSubMode(id)}
                    disabled={isDisabled}
                    className={`px-3 py-1 rounded-full border text-xs transition-all ${
                      isActive
                        ? 'border-white/20 bg-white/5 text-white/70'
                        : isDisabled
                          ? 'border-white/5 text-white/20 cursor-not-allowed'
                          : 'border-white/10 text-white/40 hover:text-white/60 hover:border-white/15 hover:bg-white/5'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Frame uploads */}
        {effectiveCreationType === 'frames-to-video' && (
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

        {/* Reference images */}
        {(effectiveCreationType === 'references-to-video' || effectiveCreationType === 'text-to-image') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/60">
                {effectiveCreationType === 'text-to-image' ? 'Reference images (optional)' : 'Reference images'}
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
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
              {result.type === 'image' ? (
                <img src={result.url} alt="Generated" className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl" />
              ) : (
                <video src={result.url} controls autoPlay loop className="max-h-[65vh] w-auto max-w-full object-contain rounded-2xl" />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setResult(null)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
                Fechar
              </button>
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

        {/* Prompt input */}
        <div className="space-y-3">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-2 shadow-2xl">
              <div className="flex items-center gap-3 px-4">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={
                    isImage
                      ? 'Describe the image you want to create...'
                      : 'Describe your video in detail...'
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }}
                  className="flex-1 bg-transparent border-none outline-none text-white/90 placeholder:text-white/30 py-4 text-base resize-none overflow-y-auto max-h-48 leading-relaxed"
                  style={{ scrollbarWidth: 'thin' }}
                  disabled={isGenerating}
                />

                {/* Send button */}
                <div className="relative group/send">
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
                  <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white/80 bg-black/80 rounded-lg border border-white/10 opacity-0 group-hover/send:opacity-100 transition-opacity whitespace-nowrap">
                    Send
                  </span>
                </div>

                {/* Enhance / Revert button */}
                {originalPrompt !== null ? (
                  <div className="relative group/revert">
                    <button
                      onClick={revertPrompt}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white/80"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white/80 bg-black/80 rounded-lg border border-white/10 opacity-0 group-hover/revert:opacity-100 transition-opacity whitespace-nowrap">
                      Revert
                    </span>
                  </div>
                ) : (
                  <div className="relative group/enhance">
                    <button
                      onClick={enhance}
                      disabled={!prompt.trim() || isEnhancing || isGenerating}
                      className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all text-purple-400 hover:text-purple-300 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </button>
                    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 text-xs text-white/80 bg-black/80 rounded-lg border border-white/10 opacity-0 group-hover/enhance:opacity-100 transition-opacity whitespace-nowrap">
                      Enhance prompt
                    </span>
                  </div>
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
