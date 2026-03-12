// ── Generations (from original MVP) ─────────────────────────────────────────
export enum AppState {
  IDLE,
  LOADING,
  SUCCESS,
  ERROR,
}

export enum VeoModel {
  VEO_FAST = 'veo-3.1-fast-generate-preview',
  VEO = 'veo-3.1-generate-preview',
  GEMINI_NANO = 'gemini-2.5-flash-image',
}

export enum AspectRatio {
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum Resolution {
  P720 = '720p',
  P1080 = '1080p',
  P4K = '4k',
}

export enum GenerationMode {
  TEXT_TO_VIDEO = 'Text to Video',
  TEXT_TO_IMAGE = 'Text to Image',
  FRAMES_TO_VIDEO = 'Frames to Video',
  REFERENCES_TO_VIDEO = 'References to Video',
  EXTEND_VIDEO = 'Extend Video',
}

export enum Duration {
  // Veo 3.1 / 3.1 Fast: 4, 6, 8
  S4 = '4',
  S6 = '6',
  S8 = '8',
  // Veo 2.0: 5, 6, 8 (720p only)
  S5 = '5',
}

export interface GenerateVideoParams {
  prompt: string;
  model: VeoModel;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: Duration;
  mode: GenerationMode;
  startFrameBuffer?: Buffer | null;
  startFrameMimeType?: string;
  endFrameBuffer?: Buffer | null;
  endFrameMimeType?: string;
  generateSound?: boolean;
}

// ── Projects & Scenes ─────────────────────────────────────────────────────────
export type SceneStatus = 'Criar imagem' | 'Criar vídeo' | 'Fazer nada';
export type ProcessingStatus = 'idle' | 'processing' | 'done' | 'error';

export interface Project {
  id: number;
  name: string;
  type: string;
  description?: string;
  drive_parent_folder_id?: string;
  spreadsheet_source?: 'local' | 'sheets';
  spreadsheet_path?: string;
  video_duration: string;
  video_resolution: string;
  created_at: string;
}

export interface Scene {
  id: number;
  project_id: number;
  row_index: number;
  time?: string;
  script?: string;
  voice_over?: string;
  emotion?: string;
  idea?: string;
  shot_type?: string;
  roll_type?: string;
  frame_a_prompt?: string;
  frame_b_prompt?: string;
  video_prompt?: string;
  text_overlay?: string;
  sound_design?: string;
  camera_movement?: string;
  music_intensity?: string;
  status: SceneStatus;
  drive_link?: string;
  processing_status: ProcessingStatus;
  error_message?: string;
  created_at: string;
}

// Row shape from spreadsheet parsing
export interface SpreadsheetRow {
  time?: string;
  script?: string;
  voice_over?: string;
  emotion?: string;
  idea?: string;
  shot_type?: string;
  roll_type?: string;
  frame_a_prompt?: string;
  frame_b_prompt?: string;
  video_prompt?: string;
  text_overlay?: string;
  sound_design?: string;
  camera_movement?: string;
  music_intensity?: string;
  status: SceneStatus;
  drive_link?: string;
}
