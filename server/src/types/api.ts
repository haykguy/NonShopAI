// useapi.net Google Flow API response types

export interface ImageGenResponse {
  jobId: string;
  media: Array<{
    name: string;
    workflowId?: string;
    image: {
      generatedImage: {
        seed: number;
        mediaGenerationId: string;
        mediaVisibility?: string;
        prompt: string;
        modelNameType?: string;
        workflowId?: string;
        fifeUrl: string;
        aspectRatio?: string;
        requestData?: any;
      };
    };
  }>;
  captcha?: CaptchaInfo;
  error?: string | ApiError;
}

export interface AssetUploadResponse {
  mediaGenerationId: {
    mediaGenerationId: string;
  };
  width: number;
  height: number;
  email: string;
  error?: string | ApiError;
}

export interface VideoGenAsyncResponse {
  jobid: string;
  type: 'video';
  status: 'created';
  created: string;
  request: any;
  response: {
    operations: Array<{
      operation: { name: string };
      sceneId: string;
      status: string;
    }>;
    captcha?: CaptchaInfo;
  };
}

export interface VideoGenSyncResponse {
  jobId: string;
  operations: Array<VideoOperation>;
  remainingCredits?: number;
  captcha?: CaptchaInfo;
  error?: string | ApiError;
}

export interface VideoOperation {
  operation: {
    name: string;
    metadata?: {
      '@type': string;
      name: string;
      video: {
        seed: number;
        mediaGenerationId: string;
        prompt: string;
        fifeUrl: string;
        mediaVisibility?: string;
        servingBaseUri?: string;
        model: string;
        isLooped?: boolean;
        aspectRatio: string;
      };
    };
    error?: { code: number; message: string };
  };
  sceneId: string;
  mediaGenerationId?: string;
  status: string;
}

export interface JobStatusResponse {
  jobid: string;
  type: 'video' | 'image';
  status: 'created' | 'started' | 'completed' | 'failed';
  created: string;
  updated?: string;
  request: any;
  response?: {
    operations?: VideoOperation[];
    media?: ImageGenResponse['media'];
    captcha?: CaptchaInfo;
  };
  error?: string;
  errorDetails?: string;
  code?: number;
}

export interface AccountsResponse {
  [email: string]: {
    health: string;
    error?: string;
    created?: string;
    sessionData?: { expires: string };
    project?: { projectId: string; projectTitle: string };
    nextRefresh?: { scheduledFor: string };
  };
}

export interface AccountHealthResponse {
  health: string;
  credits?: {
    credits: number;
    userPaygateTier: string;
  };
  models?: {
    videoModels: Array<{
      key: string;
      displayName: string;
      creditCost?: number;
    }>;
  };
  error?: string;
}

export interface CaptchaInfo {
  service: string;
  taskId?: string;
  durationMs: number;
  attempts?: Array<{
    service: string;
    taskId?: string;
    durationMs: number;
    success: boolean;
    error?: string;
  }>;
}

export interface CaptchaProvidersResponse {
  AntiCaptcha?: string;
  EzCaptcha?: string;
  CapSolver?: string;
  YesCaptcha?: string;
  SolveCaptcha?: string;
  '2Captcha'?: string;
  freeCaptchaCredits?: number;
}

export interface CaptchaStatsSummary {
  from: string;
  to: string;
  time_span: string;
  sample_size_by_provider: Record<string, number>;
  success_rate_by_provider: Record<string, number>;
  by_status_code_images: Record<string, number>;
  by_status_code_videos: Record<string, number>;
  avg_captcha_ms: number;
  avg_api_ms: number;
  avg_attempt: number;
}

export interface CaptchaStatsRecord {
  timestamp: string;
  jobId: string;
  provider: string;
  taskId: string;
  route: string;
  statusText: string;
  pageAction: string;
  error: string;
  statusCode: number;
  captchaDurationMs: number;
  apiDurationMs: number;
  attemptNumber: number;
}

export interface CaptchaStatsResponse {
  date?: string;
  limit?: number;
  provider?: string;
  total: number;
  summary?: CaptchaStatsSummary;
  data: CaptchaStatsRecord[];
}

export interface ApiError {
  code: number;
  message: string;
  status: string;
  details?: Array<{
    '@type': string;
    reason: string;
    metadata?: any;
  }>;
}
