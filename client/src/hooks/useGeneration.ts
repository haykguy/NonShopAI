import { useEffect, useRef, useState, useCallback } from 'react';
import type { PipelineEvent, Clip } from '../types';

export function useGeneration(projectId: string | null) {
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [connected, setConnected] = useState(false);
  const [pendingReview, setPendingReview] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!projectId) return;

    const es = new EventSource(`/api/projects/${projectId}/status`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      try {
        const event: PipelineEvent = JSON.parse(e.data);
        setEvents(prev => [...prev, event]);

        // Handle specific events
        if (event.type === 'initial_state' && event.data?.clips) {
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
          // Pipeline done - refresh full state
        }
      } catch {}
    };

    es.onerror = () => {
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
    progress,
    completedCount,
    failedCount,
    totalCount,
    disconnect,
  };
}
