export interface ProjectSettings {
  titleText: string;
  titlePosition: 'top' | 'bottom';
  autoPickImage: boolean;
  borderWidthPercent: number;
  aspectRatio: '9:16' | '16:9';
  titleYPercent: number;
  titleFontSize: number;
  titleColor: string;
  titleBoxOpacity: number;
}

export interface GeneratedImage {
  fifeUrl: string;
  mediaGenerationId: string;
  seed: number;
}

export interface Clip {
  index: number;
  imagePrompt: string;
  videoPrompt: string;
  status: string;
  retryCount: number;
  error?: string;
  imageJobId?: string;
  generatedImages?: GeneratedImage[];
  selectedImageIndex?: number;
  localImagePath?: string;
  uploadedMediaGenerationId?: string;
  videoJobId?: string;
  videoFifeUrl?: string;
  localVideoPath?: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  status: string;
  settings: ProjectSettings;
  clips: Clip[];
  finalVideoPath?: string;
  accountEmail?: string;
}

export interface PipelineEvent {
  type: string;
  projectId: string;
  clipIndex?: number;
  data?: any;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  accountCount?: number;
  accounts?: Record<string, any>;
  primaryAccount?: {
    email: string;
    health: string;
    credits?: { credits: number; userPaygateTier: string };
    models?: Array<{ key: string; name: string; cost?: number }>;
  };
}
