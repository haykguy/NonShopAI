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
  status: ClipStatus;
  retryCount: number;
  error?: string;
  // Avatar image (pre-supplied starting frame for Veo 3)
  avatarImageUrl?: string;
  // Image generation
  imageJobId?: string;
  generatedImages?: GeneratedImage[];
  selectedImageIndex?: number;
  localImagePath?: string;
  // Asset upload
  uploadedMediaGenerationId?: string;
  // Video generation
  videoJobId?: string;
  videoFifeUrl?: string;
  localVideoPath?: string;
}

export type ClipStatus =
  | 'pending'
  | 'generating_image'
  | 'reviewing_image'
  | 'uploading_asset'
  | 'generating_video'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  status: ProjectStatus;
  settings: ProjectSettings;
  clips: Clip[];
  finalVideoPath?: string;
  accountEmail?: string;
}

export type ProjectStatus =
  | 'draft'
  | 'generating'
  | 'paused_for_review'
  | 'compiling'
  | 'completed'
  | 'error';

export interface PipelineEvent {
  type: string;
  projectId: string;
  clipIndex?: number;
  data?: any;
  timestamp: string;
}
