import React, { useState, useRef, useEffect } from 'react';
import {
  SparklesIcon,
  RectangleStackIcon,
  TvIcon,
  ChevronDownIcon,
  XMarkIcon,
  ClockIcon,
} from './icons';
import { VeoModel, AspectRatio, Resolution, GenerationMode, Duration } from '../types';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selected,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="mb-4" ref={containerRef}>
      <label className="text-xs font-medium text-gray-400 block mb-1.5">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg px-3 py-2.5 text-left flex items-center justify-between focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
          <span className="text-sm text-gray-300 truncate">
            {selected.length === 0
              ? 'Select options...'
              : `${selected.length} selected`}
          </span>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#2c2c2e] border border-gray-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => toggleOption(option)}
                className="flex items-center px-3 py-2 hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  readOnly
                  className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-200">{option}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/50 text-indigo-200 border border-indigo-700/50">
              {item}
              <button
                type="button"
                onClick={() => toggleOption(item)}
                className="ml-1 text-indigo-400 hover:text-white">
                <XMarkIcon className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

interface RightSidebarProps {
  model: VeoModel;
  setModel: (model: VeoModel) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  resolution: Resolution;
  setResolution: (res: Resolution) => void;
  duration: Duration;
  setDuration: (duration: Duration) => void;
  generateSound: boolean;
  setGenerateSound: (sound: boolean) => void;
  projectPrompt: string;
  setProjectPrompt: (prompt: string) => void;
  styleSettings: string[];
  setStyleSettings: (settings: string[]) => void;
  lightSettings: string[];
  setLightSettings: (settings: string[]) => void;
  lensSettings: string[];
  setLensSettings: (settings: string[]) => void;
  generationMode: GenerationMode;
}

const STYLE_OPTIONS = [
  'Cinematic', 'Photorealistic', 'Anime', '3D Render', 'Cyberpunk', 
  'Noir', 'Vintage', 'Watercolor', 'Oil Painting', 'Cartoon', 
  'Minimalist', 'Surreal', 'Fantasy', 'Sci-Fi', 'Documentary'
];

const LIGHT_OPTIONS = [
  'Natural Light', 'Studio Lighting', 'Neon', 'Golden Hour', 
  'Cinematic Lighting', 'Volumetric Lighting', 'Dark/Moody', 
  'Bright/Airy', 'Hard Light', 'Soft Light', 'Rim Light'
];

const LENS_OPTIONS = [
  'Wide Angle', 'Telephoto', 'Macro', 'Fisheye', 'Bokeh', 
  'Shallow Depth of Field', '35mm', '85mm', '50mm', 'Anamorphic'
];

const aspectRatioDisplayNames: Record<AspectRatio, string> = {
  [AspectRatio.LANDSCAPE]: 'Landscape (16:9)',
  [AspectRatio.PORTRAIT]: 'Portrait (9:16)',
};

const RightSidebar: React.FC<RightSidebarProps> = ({
  model,
  setModel,
  aspectRatio,
  setAspectRatio,
  resolution,
  setResolution,
  duration,
  setDuration,
  generateSound,
  setGenerateSound,
  projectPrompt,
  setProjectPrompt,
  styleSettings,
  setStyleSettings,
  lightSettings,
  setLightSettings,
  lensSettings,
  setLensSettings,
  generationMode,
}) => {
  const isExtendMode = generationMode === GenerationMode.EXTEND_VIDEO;
  const isReferenceMode = generationMode === GenerationMode.REFERENCES_TO_VIDEO;
  const isImageMode = generationMode === GenerationMode.TEXT_TO_IMAGE;

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col h-full overflow-y-auto p-4">
      <h2 className="text-lg font-semibold text-gray-200 mb-6">Settings</h2>

      {/* Project Prompt */}
      <div className="mb-6">
        <label className="text-xs font-medium text-gray-400 block mb-1.5">
          Project Prompt
        </label>
        <textarea
          value={projectPrompt}
          onChange={(e) => setProjectPrompt(e.target.value)}
          placeholder="Enter a prompt to append to all generations..."
          className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none h-24"
        />
        <p className="text-[10px] text-gray-500 mt-1">
          This will be prepended to your main prompt.
        </p>
      </div>

      <div className="h-px bg-gray-800 mb-6" />

      {/* Core Settings */}
      <div className="mb-4">
        <label className="text-xs font-medium text-gray-400 block mb-1.5">
          Model
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SparklesIcon className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as VeoModel)}
            className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
            {isImageMode ? (
              <option value={VeoModel.GEMINI_NANO}>
                Nano Banana (Gemini 2.5 Flash Image)
              </option>
            ) : (
              Object.values(VeoModel)
                .filter((m) => m !== VeoModel.GEMINI_NANO)
                .map((modelValue) => (
                  <option key={modelValue} value={modelValue}>
                    {modelValue === VeoModel.VEO
                      ? 'High Quality (Veo 3.1)'
                      : 'Fast (Veo 3.1)'}
                  </option>
                ))
            )}
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-gray-400 block mb-1.5">
          Aspect Ratio
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <RectangleStackIcon className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
            {Object.entries(aspectRatioDisplayNames).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs font-medium text-gray-400 block mb-1.5">
          Resolution
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <TvIcon className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={resolution}
            onChange={(e) => setResolution(e.target.value as Resolution)}
            disabled={isExtendMode}
            className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <option value={Resolution.P720}>720p</option>
            <option value={Resolution.P1080}>1080p</option>
            <option value={Resolution.P4K}>4K</option>
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        {isExtendMode && (
          <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter">
            Extension is locked to 720p
          </p>
        )}
      </div>

      <div className="mb-6">
        <label className="text-xs font-medium text-gray-400 block mb-1.5">
          Duration
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <ClockIcon className="w-4 h-4 text-gray-500" />
          </div>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value as Duration)}
            disabled={isExtendMode || isImageMode}
            className="w-full bg-[#1f1f1f] border border-gray-600 rounded-lg pl-9 pr-8 py-2.5 text-sm appearance-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
            <option value={Duration.S5}>5 Seconds</option>
            <option value={Duration.S10}>10 Seconds</option>
          </select>
          <ChevronDownIcon className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>
        {isExtendMode && (
          <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-tighter">
            Extension adds ~5s
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="flex items-center">
          <input
            id="generate-sound-checkbox-sidebar"
            type="checkbox"
            checked={generateSound}
            onChange={(e) => setGenerateSound(e.target.checked)}
            className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800 cursor-pointer"
          />
          <label
            htmlFor="generate-sound-checkbox-sidebar"
            className="ml-2 text-sm font-medium text-gray-300 cursor-pointer">
            Generate Sound
          </label>
        </div>
      </div>

      <div className="h-px bg-gray-800 mb-6" />

      {/* Creative Settings */}
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">
        Creative Control
      </h3>

      <MultiSelect
        label="Style Settings"
        options={STYLE_OPTIONS}
        selected={styleSettings}
        onChange={setStyleSettings}
      />

      <MultiSelect
        label="Light Settings"
        options={LIGHT_OPTIONS}
        selected={lightSettings}
        onChange={setLightSettings}
      />

      <MultiSelect
        label="Lens Settings"
        options={LENS_OPTIONS}
        selected={lensSettings}
        onChange={setLensSettings}
      />
    </div>
  );
};

export default RightSidebar;
