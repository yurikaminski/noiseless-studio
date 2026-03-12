
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Video} from '@google/genai';
import React, {useCallback, useEffect, useState} from 'react';
import ApiKeyDialog from './components/ApiKeyDialog';
import {CurvedArrowDownIcon} from './components/icons';
import LoadingIndicator from './components/LoadingIndicator';
import PromptForm from './components/PromptForm';
import VideoResult from './components/VideoResult';
import Sidebar, { Generation } from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import { generateVideo, generateTitle } from './services/geminiService';
import {
  AppState,
  AspectRatio,
  GenerateVideoParams,
  GenerationMode,
  ImageFile,
  Resolution,
  VeoModel,
  VideoFile,
  Duration,
} from './types';

// ... existing code ...

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastConfig, setLastConfig] = useState<GenerateVideoParams | null>(
    null,
  );
  const [lastVideoObject, setLastVideoObject] = useState<Video | null>(null);
  const [lastVideoBlob, setLastVideoBlob] = useState<Blob | null>(null);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [resultType, setResultType] = useState<'video' | 'image'>('video');
  const [generations, setGenerations] = useState<Generation[]>([]);

  const [initialFormValues, setInitialFormValues] =
    useState<GenerateVideoParams | null>(null);

  // Settings State
  const [model, setModel] = useState<VeoModel>(VeoModel.VEO_FAST);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.LANDSCAPE);
  const [resolution, setResolution] = useState<Resolution>(Resolution.P720);
  const [duration, setDuration] = useState<Duration>(Duration.S5);
  const [generateSound, setGenerateSound] = useState(false);
  const [generationMode, setGenerationMode] = useState<GenerationMode>(GenerationMode.TEXT_TO_VIDEO);
  
  // New Sidebar State
  const [projectPrompt, setProjectPrompt] = useState('');
  const [styleSettings, setStyleSettings] = useState<string[]>([]);
  const [lightSettings, setLightSettings] = useState<string[]>([]);
  const [lensSettings, setLensSettings] = useState<string[]>([]);

  const fetchGenerations = async () => {
    try {
      console.log('Fetching generations...');
      const response = await fetch('/api/generations');
      console.log('Fetch response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched generations:', data);
        setGenerations(data);
      } else {
        console.error('Failed to fetch generations:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch generations:', error);
    }
  };

  useEffect(() => {
    fetchGenerations();
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          if (!(await window.aistudio.hasSelectedApiKey())) {
            setShowApiKeyDialog(true);
          }
        } catch (error) {
          console.warn(
            'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
            error,
          );
          setShowApiKeyDialog(true);
        }
      }
    };
    checkApiKey();
  }, []);

  // Sync settings when initialValues changes (e.g. Retry or History select)
  useEffect(() => {
    if (initialFormValues) {
      setModel(initialFormValues.model);
      setAspectRatio(initialFormValues.aspectRatio);
      setResolution(initialFormValues.resolution);
      setDuration(initialFormValues.duration || Duration.S5);
      setGenerateSound(initialFormValues.generateSound || false);
      setGenerationMode(initialFormValues.mode);
      // Note: We don't have saved state for projectPrompt/style/light/lens in the history yet,
      // so we leave them as is or reset them. For now, let's keep them as is to allow
      // applying current settings to old prompts, or maybe reset them?
      // Let's keep them to allow "remixing" with new settings.
    }
  }, [initialFormValues]);

  // Mode switching logic for Model
  useEffect(() => {
    if (generationMode === GenerationMode.TEXT_TO_IMAGE) {
      setModel(VeoModel.GEMINI_NANO);
    } else if (model === VeoModel.GEMINI_NANO) {
      setModel(VeoModel.VEO_FAST);
    }
    
    if (generationMode === GenerationMode.EXTEND_VIDEO) {
      setResolution(Resolution.P720);
    }
  }, [generationMode, model]);

  const showStatusError = (message: string) => {
    setErrorMessage(message);
    setAppState(AppState.ERROR);
  };

  const constructFullPrompt = (mainPrompt: string) => {
    const parts = [];
    if (projectPrompt.trim()) parts.push(projectPrompt.trim());
    if (mainPrompt.trim()) parts.push(mainPrompt.trim());
    
    if (styleSettings.length > 0) {
      parts.push(`Style Settings: ${styleSettings.join(', ')}`);
    }
    if (lightSettings.length > 0) {
      parts.push(`Light settings: ${lightSettings.join(', ')}`);
    }
    if (lensSettings.length > 0) {
      parts.push(`Lens Settings: ${lensSettings.join(', ')}`);
    }
    
    return parts.join('\n');
  };

  const handleGenerate = useCallback(async (
    prompt: string,
    files: {
      startFrame?: ImageFile | null;
      endFrame?: ImageFile | null;
      referenceImages?: ImageFile[];
      styleImage?: ImageFile | null;
      inputVideo?: VideoFile | null;
      inputVideoObject?: Video | null;
    },
    isLooping: boolean
  ) => {
    if (window.aistudio) {
      try {
        if (!(await window.aistudio.hasSelectedApiKey())) {
          setShowApiKeyDialog(true);
          return;
        }
      } catch (error) {
        console.warn(
          'aistudio.hasSelectedApiKey check failed, assuming no key selected.',
          error,
        );
        setShowApiKeyDialog(true);
        return;
      }
    }

    setAppState(AppState.LOADING);
    setErrorMessage(null);
    setInitialFormValues(null);

    const fullPrompt = constructFullPrompt(prompt);
    
    const params: GenerateVideoParams = {
      prompt: fullPrompt,
      model,
      aspectRatio,
      resolution,
      duration,
      mode: generationMode,
      ...files,
      isLooping,
      generateSound,
    };

    setLastConfig(params);

    let generationId: number | null = null;

    try {
      // 1. Generate Title and Save Initial Record
      // Use original prompt for title generation to avoid clutter
      const title = await generateTitle(prompt || 'Untitled');
      const expectedType = params.mode === GenerationMode.TEXT_TO_IMAGE ? 'image' : 'video';
      
      const startResponse = await fetch('/api/generations/start', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          prompt: params.prompt,
          title,
          type: expectedType,
        }),
      });

      if (startResponse.ok) {
        const data = await startResponse.json();
        generationId = data.id;
        fetchGenerations(); // Refresh sidebar immediately
      }

      // 2. Generate Content
      const {objectUrl, blob, video, type} = await generateVideo(params);
      setVideoUrl(objectUrl);
      setLastVideoBlob(blob);
      setLastVideoObject(video || null);
      setResultType(type);
      setAppState(AppState.SUCCESS);

      // 3. Update Record with File
      if (generationId) {
        const formData = new FormData();
        formData.append('file', blob, type === 'video' ? 'video.mp4' : 'image.png');
        
        await fetch(`/api/generations/${generationId}/complete`, {
          method: 'PUT',
          body: formData,
        });
        fetchGenerations(); // Refresh sidebar again to confirm completion (optional but good)
      }

    } catch (error) {
      console.error('Video generation failed:', error);
      
      // Clean up failed generation record
      if (generationId) {
        try {
          await fetch(`/api/generations/${generationId}`, { method: 'DELETE' });
          fetchGenerations();
        } catch (cleanupError) {
          console.error('Failed to cleanup failed generation:', cleanupError);
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred.';

      let userFriendlyMessage = `Video generation failed: ${errorMessage}`;
      let shouldOpenDialog = false;

      if (typeof errorMessage === 'string') {
        if (errorMessage.includes('Requested entity was not found.')) {
          userFriendlyMessage =
            'Model not found. This can be caused by an invalid API key or permission issues. Please check your API key.';
          shouldOpenDialog = true;
        } else if (
          errorMessage.includes('API_KEY_INVALID') ||
          errorMessage.includes('API key not valid') ||
          errorMessage.toLowerCase().includes('permission denied') ||
          errorMessage.includes('403')
        ) {
          userFriendlyMessage =
            'Your API key is invalid or lacks permissions. Please select a valid, billing-enabled API key.';
          shouldOpenDialog = true;
        }
      }

      setErrorMessage(userFriendlyMessage);
      setAppState(AppState.ERROR);

      if (shouldOpenDialog) {
        setShowApiKeyDialog(true);
      }
    }
  }, [
    model, aspectRatio, resolution, duration, generationMode, generateSound,
    projectPrompt, styleSettings, lightSettings, lensSettings
  ]);

  const handleRetry = useCallback(() => {
    if (lastConfig) {
      // This is a bit complex because lastConfig has the FULL prompt.
      // We might want to just re-run with lastConfig.
      // But handleGenerate expects components.
      // For simplicity, let's just re-run the generation logic directly or
      // set initial values and let user click generate.
      // The original handleRetry called handleGenerate(lastConfig).
      // But now handleGenerate signature changed.
      
      // Alternative: Just restore state and let user click generate.
      setInitialFormValues(lastConfig);
      // We need to parse the full prompt back to components if we want to edit them?
      // Or just put the full prompt in the prompt box?
      // Let's just put the full prompt in the prompt box for now.
    }
  }, [lastConfig]);

  const handleApiKeyDialogContinue = async () => {
    setShowApiKeyDialog(false);
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
    }
    if (appState === AppState.ERROR && lastConfig) {
      handleRetry();
    }
  };

  const handleNewVideo = useCallback(() => {
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
    setLastConfig(null);
    setLastVideoObject(null);
    setLastVideoBlob(null);
    setInitialFormValues(null);
    setResultType('video');
  }, []);

  const handleTryAgainFromError = useCallback(() => {
    if (lastConfig) {
      setInitialFormValues(lastConfig);
      setAppState(AppState.IDLE);
      setErrorMessage(null);
    } else {
      handleNewVideo();
    }
  }, [lastConfig, handleNewVideo]);

  const handleExtend = useCallback(async () => {
    if (lastConfig && lastVideoBlob && lastVideoObject) {
      try {
        // ... existing code ...

        setInitialFormValues({
          ...lastConfig,
          mode: GenerationMode.EXTEND_VIDEO,
          prompt: '', 
          inputVideo: videoFile, 
          inputVideoObject: lastVideoObject, 
          resolution: Resolution.P720, 
          duration: Duration.S5, // Extension is usually fixed duration
          startFrame: null,
          endFrame: null,
          referenceImages: [],
          styleImage: null,
          isLooping: false,
        });

        // ... existing code ...
      } catch (error) {
        // ... existing code ...
      }
    }
  }, [lastConfig, lastVideoBlob, lastVideoObject]);

  const handleGenerateVideoFromImage = useCallback(
    async (asStartFrame: boolean) => {
      if (lastVideoBlob && videoUrl) {
        try {
          // ... existing code ...
            setInitialFormValues({
              prompt: '',
              model: VeoModel.VEO_FAST,
              aspectRatio: lastConfig?.aspectRatio ?? AspectRatio.LANDSCAPE,
              resolution: Resolution.P720,
              duration: Duration.S5,
              mode: GenerationMode.FRAMES_TO_VIDEO,
              startFrame: asStartFrame ? imageFile : null,
              endFrame: !asStartFrame ? imageFile : null,
              referenceImages: [],
              styleImage: null,
              inputVideo: null,
              inputVideoObject: null,
              isLooping: false,
              generateSound: false,
            });

            // ... existing code ...
        } catch (error) {
          // ... existing code ...
        }
      }
    },
    [lastVideoBlob, videoUrl, lastConfig],
  );

  const handleSelectGeneration = (gen: Generation) => {
    setInitialFormValues({
      prompt: gen.prompt,
      model: VeoModel.VEO_FAST,
      aspectRatio: AspectRatio.LANDSCAPE,
      resolution: Resolution.P720,
      duration: Duration.S5,
      mode: gen.type === 'video' ? GenerationMode.TEXT_TO_VIDEO : GenerationMode.TEXT_TO_IMAGE,
      startFrame: null,
      endFrame: null,
      referenceImages: [],
      styleImage: null,
      inputVideo: null,
      inputVideoObject: null,
      isLooping: false,
      generateSound: false,
    });
    setAppState(AppState.IDLE);
    setVideoUrl(null);
    setErrorMessage(null);
  };

  const renderError = (message: string) => (
    <div className="text-center bg-red-900/20 border border-red-500 p-8 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">Error</h2>
      <p className="text-red-300">{message}</p>
      <button
        onClick={handleTryAgainFromError}
        className="mt-6 px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
        Try Again
      </button>
    </div>
  );

  const canExtend = lastConfig?.resolution === Resolution.P720;

  return (
    <div className="h-screen bg-black text-gray-200 flex font-sans overflow-hidden">
      <Sidebar generations={generations} onSelect={handleSelectGeneration} onRefresh={fetchGenerations} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {showApiKeyDialog && (
          <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />
        )}
        <header className="py-6 flex items-center justify-center px-8 relative z-10">
          <h1
            className="text-4xl sm:text-5xl font-semibold tracking-tighter text-center pb-2"
            style={{
              background:
                'linear-gradient(to right, #C084FC 0%, #7B35C8 35%, #7B35C8 65%, #C084FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
            }}>
            Noiseless Studio
          </h1>
        </header>
        <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col p-4 overflow-y-auto">
          {appState === AppState.IDLE ? (
          <>
            <div className="flex-grow flex items-center justify-center flex-col">
              <div className="relative text-center flex flex-col items-center">
                <h2 className="text-3xl text-gray-600">
                  Type in the prompt box to start
                </h2>
                <CurvedArrowDownIcon className="mt-4 w-24 h-24 text-gray-700 opacity-60" />
              </div>
            </div>
            <div className="pb-4">
              <PromptForm
                onGenerate={handleGenerate}
                initialValues={initialFormValues}
                generationMode={generationMode}
                setGenerationMode={setGenerationMode}
              />
            </div>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            {appState === AppState.LOADING && (
              <LoadingIndicator
                type={
                  lastConfig?.mode === GenerationMode.TEXT_TO_IMAGE
                    ? 'image'
                    : 'video'
                }
              />
            )}
            {appState === AppState.SUCCESS && videoUrl && (
              resultType === 'video' ? (
                <VideoResult
                  videoUrl={videoUrl}
                  onRetry={handleRetry}
                  onNewVideo={handleNewVideo}
                  onExtend={handleExtend}
                  canExtend={canExtend}
                  aspectRatio={lastConfig?.aspectRatio || AspectRatio.LANDSCAPE}
                />
              ) : (
                <div className="w-full relative flex flex-col items-center gap-8 p-12 bg-gray-800/50 rounded-lg border border-gray-700 shadow-2xl overflow-visible">
                  <button
                    onClick={handleNewVideo}
                    className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-lg shadow-purple-900/20 z-10">
                    <CurvedArrowDownIcon className="w-4 h-4 rotate-90" />
                    New
                  </button>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-200">
                      Your Image is Ready!
                    </h2>
                    <p className="text-sm text-gray-400 mt-1 italic">
                      Generated with Gemini Nano
                    </p>
                  </div>
                  <div className="relative group">
                    <img
                      src={videoUrl}
                      alt="Generated"
                      className="max-w-full max-h-[70vh] rounded-lg shadow-2xl"
                    />
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    <button
                      onClick={handleRetry}
                      className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                      Retry
                    </button>
                    <a
                      href={videoUrl}
                      download="generated-image.png"
                      className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                      Download
                    </a>
                    <button
                      onClick={() => handleGenerateVideoFromImage(true)}
                      className="px-6 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">
                      Use as Start Frame
                    </button>
                    <button
                      onClick={() => handleGenerateVideoFromImage(false)}
                      className="px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                      Use as End Frame
                    </button>
                  </div>
                </div>
              )
            )}
            {appState === AppState.SUCCESS &&
              !videoUrl &&
              renderError(
                'Video generated, but URL is missing. Please try again.',
              )}
            {appState === AppState.ERROR &&
              errorMessage &&
              renderError(errorMessage)}
          </div>
        )}
        </main>
      </div>

      <RightSidebar
        model={model}
        setModel={setModel}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        resolution={resolution}
        setResolution={setResolution}
        duration={duration}
        setDuration={setDuration}
        generateSound={generateSound}
        setGenerateSound={setGenerateSound}
        projectPrompt={projectPrompt}
        setProjectPrompt={setProjectPrompt}
        styleSettings={styleSettings}
        setStyleSettings={setStyleSettings}
        lightSettings={lightSettings}
        setLightSettings={setLightSettings}
        lensSettings={lensSettings}
        setLensSettings={setLensSettings}
        generationMode={generationMode}
      />
    </div>
  );
};

export default App;
