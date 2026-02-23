import { useEffect, useRef, useState, useCallback } from 'react';
import type { PipelineEvent, Clip } from '../types';

export function useGeneration(projectId: string | null) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [connected, setConnected] = useState(false);
  const [pendingReview, setPendingReview] = useState<number | null>(null);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [finalVideoPath, setFinalVideoPath] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;

    const es = new EventSource(`/api/projects/${projectId}/status`);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log(`[useGeneration] SSE connected for project ${projectId}`);
      setConnected(true);
    };

    es.onmessage = (e) => {
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        console.log(`[useGeneration] Event: ${event.type}`, event);
        setEvents(prev => [...prev, event]);

        // Handle specific events
        if (event.type === 'initial_state' && event.data?.clips) {
          setClips(event.data.clips);
        }

        if (event.type === 'no_pipeline') {
          console.warn(`[useGeneration] no_pipeline:`, event.data?.message);
          // Only set an error if the server sent back a reset project (was stuck in 'generating')
          if (event.data?.project) {
            setPipelineError(event.data.message ?? 'Server restarted mid-generation.');
            setClips(event.data.project.clips);
          }
          // If no project data, it's just a normal draft — ignore silently
        }

        if (event.type === 'clip_status_changed' && event.clipIndex !== undefined) {
          setClips(prev => prev.map(c =>
            c.index === event.clipIndex
              ? { ...c, status: event.data?.status || c.status }
              : c
          ));
        }

        if (event.type === 'clip_completed' && event.clipIndex !== undefined) {
          setClips(prev => prev.map(c =>
            c.index === event.clipIndex ? { ...c, status: 'completed' } : c
          ));
        }

        if (event.type === 'clip_failed' && event.clipIndex !== undefined) {
          console.error(`[useGeneration] Clip ${event.clipIndex} failed:`, event.data?.error);
          setClips(prev => prev.map(c =>
            c.index === event.clipIndex
              ? { ...c, status: 'failed', error: event.data?.error }
              : c
          ));
        }

        if (event.type === 'clip_skipped' && event.clipIndex !== undefined) {
          setClips(prev => prev.map(c =>
            c.index === event.clipIndex ? { ...c, status: 'skipped' } : c
          ));
        }

        if (event.type === 'compiling') {
          // Pipeline finished generating — now compiling
          setIsCompiling(true);
          console.log(`[useGeneration] Auto-compiling...`, event.data);
        }

        if (event.type === 'pipeline_completed') {
          setIsCompiling(false);
          // Sync all clips to their final status from the server's project data
          // (handles the case where some SSE events were missed)
          if (event.data?.clips) {
            setClips(event.data.clips);
          }
          if (event.data?.finalVideoPath) {
            setFinalVideoPath(event.data.finalVideoPath);
          }
        }

        if (event.type === 'image_review_needed' && event.clipIndex !== undefined) {
          setClips(prev => prev.map(c =>
            c.index === event.clipIndex
              ? { ...c, status: 'reviewing_image', generatedImages: event.data?.images }
              : c
          ));
          setPendingReview(event.clipIndex);
        }

        if (event.type === 'image_selected') {
          setPendingReview(null);
        }

        if (event.type === 'pipeline_error') {
          console.error(`[useGeneration] Pipeline error:`, event.data?.message);
          setPipelineError(event.data?.message ?? 'Pipeline failed');
        }

        if (event.type === 'pipeline_completed') {
          console.log(`[useGeneration] Pipeline completed:`, event.data);
        }
      } catch (parseErr) {
        console.error('[useGeneration] Failed to parse SSE event:', e.data, parseErr);
      }
    };

    es.onerror = (err) => {
      console.error(`[useGeneration] SSE error for project ${projectId}:`, err);
      setConnected(false);
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [projectId]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    setConnected(false);
  }, []);

  const completedCount = clips.filter(c => c.status === 'completed').length;
  const failedCount = clips.filter(c => c.status === 'failed' || c.status === 'skipped').length;
  const totalCount = clips.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    events,
    clips,
    connected,
    pendingReview,
    pipelineError,
    finalVideoPath,
    isCompiling,
    progress,
    completedCount,
    failedCount,
    totalCount,
    disconnect,
  };
}
