import { useState, useCallback } from 'react';
import { api } from './useApi';
import type { Project, Clip } from '../types';

export function useProject() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(async (
    name: string,
    clipCount: number,
    settings: any
  ): Promise<Project> => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.post<Project>('/projects', { name, clipCount, settings });
      setProject(p);
      return p;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const p = await api.get<Project>(`/projects/${id}`);
      setProject(p);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClips = useCallback(async (clips: Array<{ imagePrompt: string; videoPrompt: string }>) => {
    if (!project) return;
    setLoading(true);
    try {
      const p = await api.put<Project>(`/projects/${project.id}/clips`, { clips });
      setProject(p);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [project]);

  const updateSettings = useCallback(async (settings: Partial<Project['settings']>) => {
    if (!project) return;
    try {
      const p = await api.put<Project>(`/projects/${project.id}`, { settings });
      setProject(p);
    } catch (err: any) {
      setError(err.message);
    }
  }, [project]);

  const parsePdf = useCallback(async (file: File) => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.upload<{ clipCount: number; clips: Clip[] }>(
        `/projects/${project.id}/parse-pdf`,
        file,
        'pdf'
      );
      setProject(prev => prev ? { ...prev, clips: result.clips } : prev);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [project]);

  const startGeneration = useCallback(async () => {
    if (!project) return;
    setError(null);
    try {
      await api.post(`/projects/${project.id}/generate`);
      setProject(prev => prev ? { ...prev, status: 'generating' } : prev);
    } catch (err: any) {
      setError(err.message);
    }
  }, [project]);

  const abortGeneration = useCallback(async () => {
    if (!project) return;
    try {
      await api.post(`/projects/${project.id}/abort`);
    } catch (err: any) {
      setError(err.message);
    }
  }, [project]);

  const selectImage = useCallback(async (clipIndex: number, imageIndex: number) => {
    if (!project) return;
    try {
      await api.post(`/projects/${project.id}/clips/${clipIndex}/select-image`, { imageIndex });
    } catch (err: any) {
      setError(err.message);
    }
  }, [project]);

  const listProjects = useCallback(async () => {
    try {
      return await api.get<Array<{
        id: string;
        name: string;
        status: string;
        createdAt: string;
        clipCount: number;
        completedClips: number;
      }>>('/projects');
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await api.del(`/projects/${id}`);
      if (project?.id === id) {
        setProject(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [project]);

  const compileVideo = useCallback(async (settings?: any) => {
    if (!project) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{ message: string; path: string }>(
        `/projects/${project.id}/compile`,
        settings
      );
      setProject(prev => prev ? { ...prev, status: 'completed', finalVideoPath: result.path } : prev);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [project]);

  return {
    project,
    setProject,
    loading,
    error,
    setError,
    createProject,
    loadProject,
    listProjects,
    deleteProject,
    updateClips,
    updateSettings,
    parsePdf,
    startGeneration,
    abortGeneration,
    selectImage,
    compileVideo,
  };
}
