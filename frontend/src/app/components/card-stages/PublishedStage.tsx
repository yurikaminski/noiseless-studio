import { useState, useRef, useEffect } from 'react';
import { CheckCircle, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize } from 'lucide-react';
import type { VideoCardFull, CardScene } from '../VideoCardModal';

interface PublishedStageProps {
  card: VideoCardFull;
  onUpdate: () => void;
}

export function PublishedStage({ card, onUpdate }: PublishedStageProps) {
  const markPublished = async () => {
    await fetch(`/api/cards/${card.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published_at: new Date().toISOString(), stage: 'published' }),
    });
    onUpdate();
  };

  if (!card.published_at) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-400/60" />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-light text-white mb-2">Ready to publish?</h3>
          <p className="text-sm text-white/40 max-w-sm">
            Mark this video as published when all scenes are generated and approved.
          </p>
        </div>
        <button
          onClick={markPublished}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-2xl shadow-lg shadow-green-500/25 transition-all"
        >
          <CheckCircle className="w-5 h-5" />
          Mark as Published
        </button>
      </div>
    );
  }

  const publishedDate = new Date(card.published_at).toLocaleString();
  const scenes = card.scenes || [];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="px-8 py-4 border-b border-white/10 flex items-center gap-4 bg-black/20 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Published</span>
        </div>
        <span className="text-xs text-white/40">{publishedDate}</span>
      </div>

      {/* Preview player */}
      <div className="flex-1 overflow-y-auto">
        {scenes.length > 0 ? (
          <PreviewPlayer scenes={scenes} cardTitle={card.title} />
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <CheckCircle className="w-10 h-10 mb-3 text-green-400/40" />
            <p className="text-sm">Published on {publishedDate}</p>
            <p className="text-xs mt-1 text-white/20">No generated scenes to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline PreviewPlayer ────────────────────────────────────────────────────

interface PreviewPlayerProps {
  scenes: CardScene[];
  cardTitle: string;
}

function PreviewPlayer({ scenes, cardTitle }: PreviewPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentScene = scenes[currentIndex];
  const hasVideo = !!currentScene?.video_url;
  const hasThumbnail = !!currentScene?.frame_a_url;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setCurrentTime(video.currentTime);
    const onDuration = () => setDuration(video.duration || 0);
    const onEnded = () => { setIsPlaying(false); if (currentIndex < scenes.length - 1) setCurrentIndex(i => i + 1); };
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('ended', onEnded);
    return () => { video.removeEventListener('timeupdate', onTime); video.removeEventListener('loadedmetadata', onDuration); video.removeEventListener('ended', onEnded); };
  }, [currentIndex, scenes.length]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) { video.pause(); setIsPlaying(false); }
    else { video.play(); setIsPlaying(true); }
  };

  const secondsToTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="px-8 pt-6 pb-8">
      {/* Player */}
      <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6">
        <div className="relative aspect-video">
          {hasVideo ? (
            <video
              ref={videoRef}
              src={currentScene.video_url}
              className="absolute inset-0 w-full h-full object-cover"
              muted={isMuted}
              onClick={togglePlay}
            />
          ) : hasThumbnail ? (
            <img src={currentScene.frame_a_url} alt={currentScene.description} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center">
              <p className="text-white/20 text-sm">{currentScene?.description || 'No preview'}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Play button overlay */}
          {!isPlaying && hasVideo && (
            <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center group">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent px-5 pt-6 pb-3">
          {/* Progress */}
          <div className="mb-2">
            <input
              type="range" min="0" max={duration || 1} step="0.1" value={currentTime}
              onChange={e => { const t = parseFloat(e.target.value); setCurrentTime(t); if (videoRef.current) videoRef.current.currentTime = t; }}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              style={{ background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)` }}
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>{secondsToTime(currentTime)}</span>
              <span className="text-white/30">Scene {currentIndex + 1} of {scenes.length}</span>
              <span>{secondsToTime(duration)}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentIndex(i => Math.max(0, i - 1))} disabled={currentIndex === 0} className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30">
                <SkipBack className="w-4 h-4 text-white" />
              </button>
              <button onClick={togglePlay} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
              </button>
              <button onClick={() => setCurrentIndex(i => Math.min(scenes.length - 1, i + 1))} disabled={currentIndex === scenes.length - 1} className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30">
                <SkipForward className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setIsMuted(v => !v)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
              </button>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Scene thumbnails */}
      <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Storyboard Scenes</h3>
      <div className="grid grid-cols-4 gap-3">
        {scenes.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() => { setCurrentIndex(i); setCurrentTime(0); setIsPlaying(false); }}
            className={`group relative bg-white/5 rounded-xl overflow-hidden border transition-all ${
              i === currentIndex ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="relative aspect-video overflow-hidden">
              {scene.frame_a_url ? (
                <img src={scene.frame_a_url} alt={scene.description} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span className="text-xs text-white/20">{i + 1}</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white">{scene.start_time || `${i + 1}`}</div>
              {i === currentIndex && <div className="absolute inset-0 border-2 border-blue-500 bg-blue-500/10" />}
            </div>
            <div className="p-2 text-left">
              <p className={`text-xs line-clamp-2 leading-relaxed ${i === currentIndex ? 'text-white' : 'text-white/60'}`}>
                {scene.description || `Scene ${i + 1}`}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
