import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Scene {
  id: string;
  startTime: string;
  endTime: string;
  description: string;
  thumbnail: string;
  subtitle?: string;
}

const mockScenes: Scene[] = [
  {
    id: '1',
    startTime: '00:00',
    endTime: '00:12',
    description: 'Detective introduces the dilemma',
    thumbnail: 'https://images.unsplash.com/photo-1769527820343-9e9afd69c78b?w=400',
    subtitle: 'You\'re each in separate rooms and you can\'t communicate with each other...'
  },
  {
    id: '2',
    startTime: '00:12',
    endTime: '00:30',
    description: 'Suspects shown in separate rooms',
    thumbnail: 'https://images.unsplash.com/photo-1764250766584-c0259d99908f?w=400',
    subtitle: 'The detective explains the situation to both suspects'
  },
  {
    id: '3',
    startTime: '00:30',
    endTime: '00:45',
    description: 'Detective explains options',
    thumbnail: 'https://images.unsplash.com/photo-1769527820343-9e9afd69c78b?w=400',
    subtitle: 'Each of you has two choices: cooperate or betray'
  },
  {
    id: '4',
    startTime: '00:45',
    endTime: '01:00',
    description: 'Clock ticking and suspects debating',
    thumbnail: 'https://images.unsplash.com/photo-1723045862559-caa5339cc765?w=400',
    subtitle: 'Time is running out. What will you choose?'
  }
];

export function PreviewPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(60); // 1 minute total
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const videoRef = useRef<HTMLDivElement>(null);

  const currentScene = mockScenes[currentSceneIndex];

  // Convert time string to seconds
  const timeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  // Convert seconds to time string
  const secondsToTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update current scene based on time
  useEffect(() => {
    const sceneIndex = mockScenes.findIndex(scene => {
      const start = timeToSeconds(scene.startTime);
      const end = timeToSeconds(scene.endTime);
      return currentTime >= start && currentTime < end;
    });
    if (sceneIndex !== -1) {
      setCurrentSceneIndex(sceneIndex);
    }
  }, [currentTime]);

  // Auto-play simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < duration) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const jumpToScene = (sceneIndex: number) => {
    const scene = mockScenes[sceneIndex];
    const startTime = timeToSeconds(scene.startTime);
    setCurrentTime(startTime);
    setCurrentSceneIndex(sceneIndex);
  };

  const goToPreviousScene = () => {
    if (currentSceneIndex > 0) {
      jumpToScene(currentSceneIndex - 1);
    }
  };

  const goToNextScene = () => {
    if (currentSceneIndex < mockScenes.length - 1) {
      jumpToScene(currentSceneIndex + 1);
    }
  };

  const progress = (currentTime / duration) * 100;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black/10">
      {/* Video Player Container */}
      <div className="px-8 pt-8 pb-4">
        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Video Display Area */}
          <div 
            ref={videoRef}
            className="relative aspect-video bg-gradient-to-br from-slate-900 to-black flex items-center justify-center"
          >
            {/* Video Background Image */}
            <ImageWithFallback
              src={currentScene.thumbnail}
              alt={currentScene.description}
              className="absolute inset-0 w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

            {/* Subtitle Overlay */}
            {currentScene.subtitle && (
              <div className="absolute bottom-16 left-0 right-0 px-12">
                <div className="bg-black/80 backdrop-blur-sm px-6 py-3 rounded-xl max-w-4xl mx-auto">
                  <p className="text-white text-center text-lg font-light leading-relaxed">
                    {currentScene.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Play/Pause Overlay Button */}
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                  <Play className="w-10 h-10 text-white ml-1" />
                </div>
              </button>
            )}
          </div>

          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent px-6 pt-8 pb-4">
            {/* Progress Bar with Scene Markers */}
            <div className="mb-3">
              <div className="relative">
                {/* Scene Markers */}
                {mockScenes.map((scene, index) => {
                  const position = (timeToSeconds(scene.startTime) / duration) * 100;
                  return (
                    <div
                      key={scene.id}
                      className="absolute top-0 h-2 w-0.5 bg-white/30 -translate-y-1"
                      style={{ left: `${position}%` }}
                    />
                  );
                })}
                
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer 
                    [&::-webkit-slider-thumb]:appearance-none 
                    [&::-webkit-slider-thumb]:w-3 
                    [&::-webkit-slider-thumb]:h-3 
                    [&::-webkit-slider-thumb]:rounded-full 
                    [&::-webkit-slider-thumb]:bg-white
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-lg
                    [&::-moz-range-thumb]:w-3
                    [&::-moz-range-thumb]:h-3
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white
                    [&::-moz-range-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:shadow-lg"
                  style={{
                    background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${progress}%, rgba(255,255,255,0.2) ${progress}%, rgba(255,255,255,0.2) 100%)`
                  }}
                />
              </div>
              
              {/* Time Display */}
              <div className="flex items-center justify-between mt-2 text-xs text-white/60">
                <span>{secondsToTime(currentTime)}</span>
                <span className="text-white/40">Scene {currentSceneIndex + 1} of {mockScenes.length}</span>
                <span>{secondsToTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              {/* Left Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPreviousScene}
                  disabled={currentSceneIndex === 0}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipBack className="w-5 h-5 text-white" />
                </button>
                
                <button
                  onClick={handlePlayPause}
                  className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </button>

                <button
                  onClick={goToNextScene}
                  disabled={currentSceneIndex === mockScenes.length - 1}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <SkipForward className="w-5 h-5 text-white" />
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none 
                      [&::-webkit-slider-thumb]:w-2.5 
                      [&::-webkit-slider-thumb]:h-2.5 
                      [&::-webkit-slider-thumb]:rounded-full 
                      [&::-webkit-slider-thumb]:bg-white
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:w-2.5
                      [&::-moz-range-thumb]:h-2.5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-white
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:border-0"
                  />
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <Settings className="w-5 h-5 text-white" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Scenes Section */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
          Storyboard Scenes
        </h3>
        
        <div className="grid grid-cols-4 gap-4">
          {mockScenes.map((scene, index) => {
            const isActive = index === currentSceneIndex;
            
            return (
              <button
                key={scene.id}
                onClick={() => jumpToScene(index)}
                className={`group relative bg-white/5 rounded-xl overflow-hidden border transition-all ${
                  isActive 
                    ? 'border-blue-500/50 shadow-lg shadow-blue-500/20' 
                    : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={scene.thumbnail}
                    alt={scene.description}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Time Badge */}
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium text-white">
                    {scene.startTime}
                  </div>

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-blue-500 bg-blue-500/10" />
                  )}
                </div>

                {/* Description */}
                <div className="p-3 text-left">
                  <p className={`text-sm leading-relaxed line-clamp-2 ${
                    isActive ? 'text-white font-medium' : 'text-white/70'
                  }`}>
                    {scene.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
