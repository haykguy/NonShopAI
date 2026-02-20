import { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { AccountHealth } from './components/AccountHealth';
import { ProjectSetup } from './components/ProjectSetup';
import { ProjectList } from './components/ProjectList';
import { ClipList } from './components/ClipList';
import { AiPromptPanel } from './components/AiPromptPanel';
import { ImageReview } from './components/ImageReview';
import { ProgressDashboard } from './components/ProgressDashboard';
import { VideoPreview } from './components/VideoPreview';
import { VideoMockupCanvas } from './components/VideoMockupCanvas';
import { useProject } from './hooks/useProject';
import { useGeneration } from './hooks/useGeneration';
import { useAiChat } from './hooks/useAiChat';
import { Play, Square, ArrowLeft } from 'lucide-react';

type Step = 'setup' | 'clips' | 'generating' | 'compile';

export default function App() {
  const {
    project,
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
  } = useProject();

  const gen = useGeneration(
    project?.status === 'generating' ? project.id : null
  );

  const [step, setStep] = useState<Step>('setup');
  const [clipDrafts, setClipDrafts] = useState<
    Array<{ imagePrompt: string; videoPrompt: string }>
  >([]);
  const [projectListKey, setProjectListKey] = useState(0);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  const aiChat = useAiChat({
    projectId: project?.id ?? null,
    projectTitle: project?.name ?? '',
    clipCount: clipDrafts.length,
    existingPrompts: clipDrafts,
  });

  // Sync step from project status
  useEffect(() => {
    if (!project) {
      setStep('setup');
      return;
    }
    if (project.status === 'generating') {
      setStep('generating');
    } else if (project.status === 'completed') {
      setStep('compile');
    } else if (project.status === 'draft' || project.status === 'error') {
      // Loaded project that has clip data - go to clips step
      const hasClipData = project.clips.some(c => c.imagePrompt || c.videoPrompt);
      const hasCompletedClips = project.clips.some(c => c.status === 'completed');
      if (hasCompletedClips) {
        setStep('compile');
      } else if (hasClipData) {
        setStep('clips');
      } else {
        setStep('clips');
      }
    }
  }, [project?.id, project?.status]);

  // Init clip drafts when project changes
  useEffect(() => {
    if (project) {
      setClipDrafts(
        project.clips.map(c => ({
          imagePrompt: c.imagePrompt,
          videoPrompt: c.videoPrompt,
        }))
      );
    }
  }, [project?.id]);

  const handleProjectCreate = async (
    name: string,
    clipCount: number,
    settings: any
  ) => {
    const p = await createProject(name, clipCount, settings);
    setClipDrafts(
      p.clips.map(c => ({
        imagePrompt: c.imagePrompt,
        videoPrompt: c.videoPrompt,
      }))
    );
    setStep('clips');
    setProjectListKey(k => k + 1);
  };

  const handleLoadProject = useCallback(async (id: string) => {
    await loadProject(id);
  }, [loadProject]);

  const handleDeleteProject = useCallback(async (id: string) => {
    await deleteProject(id);
    setProjectListKey(k => k + 1);
  }, [deleteProject]);

  const handleBackToSetup = () => {
    setStep('setup');
  };

  const handleParsePdf = async (file: File) => {
    const result = await parsePdf(file);
    if (result?.clips) {
      setClipDrafts(
        result.clips.map((c: any) => ({
          imagePrompt: c.imagePrompt,
          videoPrompt: c.videoPrompt,
        }))
      );
    }
  };

  const handleApplyGeneratedPrompts = useCallback(() => {
    if (!aiChat.generatedPrompts) return;
    const generated = aiChat.generatedPrompts;
    const newDrafts = clipDrafts.map((existing, i) => ({
      imagePrompt: generated[i]?.imagePrompt ?? existing.imagePrompt,
      videoPrompt: generated[i]?.videoPrompt ?? existing.videoPrompt,
    }));
    setClipDrafts(newDrafts);
    setAiPanelOpen(false);
  }, [aiChat.generatedPrompts, clipDrafts]);

  const handleStartGeneration = async () => {
    const hasPrompts = clipDrafts.some(c => c.imagePrompt || c.videoPrompt);
    if (!hasPrompts) {
      setError('Please add at least one clip with prompts');
      return;
    }
    await updateClips(clipDrafts);
    await startGeneration();
    setStep('generating');
  };

  const handleAbort = async () => {
    await abortGeneration();
  };

  // Move to compile when generation completes
  useEffect(() => {
    if (
      gen.totalCount > 0 &&
      gen.completedCount + gen.failedCount === gen.totalCount
    ) {
      setStep('compile');
      setProjectListKey(k => k + 1);
    }
  }, [gen.completedCount, gen.failedCount, gen.totalCount]);

  // Find clip pending review
  const reviewClip =
    gen.pendingReview !== null
      ? gen.clips.find(c => c.index === gen.pendingReview)
      : null;

  return (
    <Layout>
      <div className="space-y-6">
        <AccountHealth />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Project List - always visible on setup, or as a collapsible on other steps */}
        {step === 'setup' && (
          <>
            <ProjectList
              key={projectListKey}
              currentProjectId={project?.id}
              onSelect={handleLoadProject}
              onDelete={handleDeleteProject}
              onRefresh={listProjects}
            />
            <ProjectSetup onCreateProject={handleProjectCreate} loading={loading} />
          </>
        )}

        {/* Step: Edit Clips */}
        {step === 'clips' && project && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToSetup}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                All Projects
              </button>
              <h2 className="text-lg font-semibold">
                {project.name}
              </h2>
              <div />
            </div>

            {/* Three-column layout: clips | AI panel (optional) | mockup canvas */}
            <div className="flex flex-col xl:flex-row gap-6 items-start">
              {/* Left: clip prompts */}
              <div className="flex-1 min-w-0 space-y-4">
                <ClipList
                  clips={clipDrafts}
                  onChange={setClipDrafts}
                  onParsePdf={handleParsePdf}
                  loading={loading}
                  onToggleAiPanel={() => setAiPanelOpen(o => !o)}
                  aiPanelOpen={aiPanelOpen}
                />

                <button
                  onClick={handleStartGeneration}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Start Generation'}
                </button>
              </div>

              {/* Center: AI prompt panel (shown when open) */}
              {aiPanelOpen && (
                <div className="w-full xl:w-80 flex-shrink-0">
                  <AiPromptPanel
                    messages={aiChat.messages}
                    phase={aiChat.phase}
                    loading={aiChat.loading}
                    error={aiChat.error}
                    onSend={aiChat.sendMessage}
                    onReset={aiChat.reset}
                    onApplyPrompts={handleApplyGeneratedPrompts}
                    hasGeneratedPrompts={!!aiChat.generatedPrompts}
                  />
                </div>
              )}

              {/* Right: visual mockup canvas */}
              <div className="w-full xl:w-80 xl:sticky xl:top-4 flex-shrink-0">
                <VideoMockupCanvas
                  settings={project.settings}
                  onChange={updateSettings}
                />
              </div>
            </div>
          </>
        )}

        {/* Step: Generation in Progress */}
        {step === 'generating' && project && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToSetup}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                All Projects
              </button>
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <button
                onClick={handleAbort}
                className="flex items-center gap-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
              >
                <Square className="w-4 h-4" />
                Abort
              </button>
            </div>

            {reviewClip && (
              <ImageReview clip={reviewClip} onSelect={selectImage} />
            )}

            <ProgressDashboard
              clips={gen.clips}
              events={gen.events}
              progress={gen.progress}
              completedCount={gen.completedCount}
              failedCount={gen.failedCount}
              totalCount={gen.totalCount}
              connected={gen.connected}
            />
          </>
        )}

        {/* Step: Compile */}
        {step === 'compile' && project && (
          <>
            <div className="flex items-center justify-between">
              <button
                onClick={handleBackToSetup}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft className="w-4 h-4" />
                All Projects
              </button>
              <h2 className="text-lg font-semibold">{project.name}</h2>
              <button
                onClick={() => setStep('clips')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Edit Clips
              </button>
            </div>

            {gen.clips.length > 0 && (
              <ProgressDashboard
                clips={gen.clips}
                events={gen.events}
                progress={gen.progress}
                completedCount={gen.completedCount}
                failedCount={gen.failedCount}
                totalCount={gen.totalCount}
                connected={gen.connected}
              />
            )}

            <VideoPreview
              projectId={project.id}
              finalVideoPath={project.finalVideoPath}
              onCompile={compileVideo}
              loading={loading}
              completedClipCount={
                gen.completedCount || project.clips.filter(c => c.status === 'completed').length
              }
            />
          </>
        )}
      </div>
    </Layout>
  );
}
