import { useEffect, useRef, useState, useCallback } from 'react';
import type { PipelineEvent, Clip } from '../types';

export function useGeneration(projectId: string | null) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [connected, setConnected] = useState(false);
  const [pendingReview, setPendingReview] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;

    console.log(`[useGeneration] Connecting to /api/projects/${projectId}/status`);
    const es = new EventSource(`/api/projects/${projectId}/status`);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log('[useGeneration] SSE connection opened');
      setConnected(true);
    };

    es.onmessage = (e) => {
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        console.log('[useGeneration] Event received:', event.type, event.clipIndex);
        setEvents(prev => [...prev, event]);

        // Handle specific events
        if (event.type === 'initial_state' && event.data?.clips) {
          console.log('[useGeneration] Initial state with', event.data.clips.length, 'clips');
          setClips(event.data.clips);
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

        if (event.type === 'pipeline_completed' || event.type === 'pipeline_error') {
          console.log('[useGeneration] Pipeline finished:', event.type);
        }
      } catch (err) {
        console.error('[useGeneration] Failed to parse event:', e.data, err);
      }
    };

    es.onerror = (err) => {
      console.error('[useGeneration] SSE error:', err);
      setConnected(false);
      es.close();
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('[useGeneration] Attempting to reconnect...');
        connect();
      }, 3000);
    };

    return () => {
      console.log('[useGeneration] Closing SSE connection');
      es.close();
      setConnected(false);
    };
  }, [projectId]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
      eventSourceRef.current?.close();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
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
    progress,
    completedCount,
    failedCount,
    totalCount,
    disconnect,
  };
}
