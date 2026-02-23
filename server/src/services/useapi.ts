import { config } from '../config';
import { logger } from '../utils/logger';
import { ApiRequestError, withRetry } from '../utils/retry';
import {
  ImageGenResponse,
  AssetUploadResponse,
  VideoGenAsyncResponse,
  VideoGenSyncResponse,
  JobStatusResponse,
  AccountsResponse,
  AccountHealthResponse,
} from '../types/api';

class UseApiClient {
  private token: string;
  private baseUrl: string;

  constructor() {
    this.token = config.useapiToken;
    this.baseUrl = config.useapiBaseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: any,
    extraHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      ...extraHeaders,
    };

    const options: RequestInit = { method, headers };

    if (body !== undefined) {
      if (body instanceof Buffer || body instanceof Uint8Array) {
        options.body = body;
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    logger.debug(`API ${method} ${path}`);
    const response = await fetch(url, options);

    let responseBody: any;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    if (!response.ok) {
      const errMsg = typeof responseBody === 'object'
        ? (responseBody.error?.message || responseBody.error || JSON.stringify(responseBody))
        : responseBody;
      throw new ApiRequestError(
        `API ${method} ${path} failed: ${response.status} ${errMsg}`,
        response.status,
        responseBody
      );
    }

    return responseBody as T;
  }

  async generateImages(
    prompt: string,
    opts: {
      model?: string;
      aspectRatio?: string;
      count?: number;
      seed?: number;
      email?: string;
    } = {}
  ): Promise<ImageGenResponse> {
    return withRetry(() =>
      this.request<ImageGenResponse>('POST', '/v1/google-flow/images', {
        prompt,
        model: opts.model || 'nano-banana-pro',
        aspectRatio: opts.aspectRatio || 'portrait',
        count: opts.count || 1,
        ...(opts.seed !== undefined && { seed: opts.seed }),
        ...(opts.email && { email: opts.email }),
      })
    );
  }

  async uploadAsset(
    imageBuffer: Buffer,
    contentType: string,
    email?: string
  ): Promise<AssetUploadResponse> {
    const path = email ? `/v1/google-flow/assets/${encodeURIComponent(email)}` : '/v1/google-flow/assets';
    return withRetry(() =>
      this.request<AssetUploadResponse>('POST', path, imageBuffer, {
        'Content-Type': contentType,
      })
    );
  }

  async generateVideoAsync(
    prompt: string,
    opts: {
      model?: string;
      aspectRatio?: string;
      count?: number;
      seed?: number;
      startImage?: string;
      endImage?: string;
      email?: string;
      replyUrl?: string;
      replyRef?: string;
    } = {}
  ): Promise<VideoGenAsyncResponse> {
    return withRetry(() =>
      this.request<VideoGenAsyncResponse>('POST', '/v1/google-flow/videos', {
        prompt,
        model: opts.model || 'veo-3.1-fast',
        aspectRatio: opts.aspectRatio || 'portrait',
        count: opts.count || 1,
        async: true,
        ...(opts.seed !== undefined && { seed: opts.seed }),
        ...(opts.startImage && { startImage: opts.startImage }),
        ...(opts.endImage && { endImage: opts.endImage }),
        ...(opts.email && { email: opts.email }),
        ...(opts.replyUrl && { replyUrl: opts.replyUrl }),
        ...(opts.replyRef && { replyRef: opts.replyRef }),
      })
    );
  }

  async generateVideoSync(
    prompt: string,
    opts: {
      model?: string;
      aspectRatio?: string;
      count?: number;
      seed?: number;
      startImage?: string;
      email?: string;
    } = {}
  ): Promise<VideoGenSyncResponse> {
    return withRetry(
      () =>
        this.request<VideoGenSyncResponse>('POST', '/v1/google-flow/videos', {
          prompt,
          model: opts.model || 'veo-3.1-fast',
          aspectRatio: opts.aspectRatio || 'portrait',
          count: opts.count || 1,
          async: false,
          ...(opts.seed !== undefined && { seed: opts.seed }),
          ...(opts.startImage && { startImage: opts.startImage }),
          ...(opts.email && { email: opts.email }),
        }),
      { maxRetries: 3, baseDelayMs: 10000 }
    );
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.request<JobStatusResponse>('GET', `/v1/google-flow/jobs/${jobId}`);
  }

  async getAccounts(): Promise<AccountsResponse> {
    return withRetry(() =>
      this.request<AccountsResponse>('GET', '/v1/google-flow/accounts')
    );
  }

  async getAccountHealth(email: string): Promise<AccountHealthResponse> {
    return withRetry(() =>
      this.request<AccountHealthResponse>('GET', `/v1/google-flow/accounts/${encodeURIComponent(email)}`)
    );
  }
}

export const apiClient = new UseApiClient();
