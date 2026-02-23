import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccountHealth } from '../components/AccountHealth';
import { ClipList } from '../components/ClipList';
import { AiPromptPanel } from '../components/AiPromptPanel';
import { ImageReview } from '../components/ImageReview';
import { ProgressDashboard } from '../components/ProgressDashboard';
import { VideoPreview } from '../components/VideoPreview';
import { VideoMockupCanvas } from '../components/VideoMockupCanvas';
import { useProject } from '../hooks/useProject';
import { useGeneration } from '../hooks/useGeneration';
import { useAiChat } from '../hooks/useAiChat';
import { Play, Square, ArrowLeft, Sparkles } from 'lucide-react';

type Step = 'clips' | 'generating' | 'compile';

export function PixarAiPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    project,
    loading,
    error,
    setError,
    createProject,
    loadProject,
    updateClips,
    updateSettings,
    parsePdf,
    startGeneration,
    abortGeneration,
    selectImage,
    compileVideo,
  } = useProject();

  const gen = useGeneration(project?.id ?? null);

  const [step, setStep] = useState<Step>('clips');
  const [clipDrafts, setClipDrafts] = useState<
    Array<{ imagePrompt: string; videoPrompt: string }>
  >([]);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const initDone = useRef(false);

  const aiChat = useAiChat({
    projectId: project?.id ?? null,
    projectTitle: project?.name ?? '',
    clipCount: clipDrafts.length,
    existingPrompts: clipDrafts,
  });

  // On mount: load from navigation state or auto-create a new project
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;

    const state = location.state as { projectId?: string } | null;
    if (state?.projectId) {
      loadProject(state.projectId);
    } else {
      const name = `Video ${new Date().toLocaleDateString()}`;
      createProject(name, 7, { autoPickImage: true }).then(p => {
        setClipDrafts(p.clips.map((c: any) => ({
          imagePrompt: c.imagePrompt,
          videoPrompt: c.videoPrompt,
        })));
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync step from project status
  useEffect(() => {
    if (!project) return;
    if (project.status === 'generating') {
      setStep('generating');
    } else if (project.status === 'completed') {
      setStep('compile');
    } else if (project.status === 'draft' || project.status === 'error') {
      const hasCompletedClips = project.clips.some(c => c.status === 'completed');
      setStep(hasCompletedClips ? 'compile' : 'clips');
    }
  }, [project?.id, project?.status]);

  // Init clip drafts when project loads
  useEffect(() => {
    if (project) {
      setClipDrafts(project.clips.map(c => ({
        imagePrompt: c.imagePrompt,
        videoPrompt: c.videoPrompt,
      })));
    }
  }, [project?.id]);

  const handleParsePdf = async (file: File) => {
    const result = await parsePdf(file);
    if (result?.clips) {
      setClipDrafts(result.clips.map((c: any) => ({
        imagePrompt: c.imagePrompt,
        videoPrompt: c.videoPrompt,
      })));
    }
  };

  const handleApplyGeneratedPrompts = useCallback(() => {
    if (!aiChat.generatedPrompts) return;
    const generated = aiChat.generatedPrompts;
    setClipDrafts(drafts => drafts.map((existing, i) => ({
      imagePrompt: generated[i]?.imagePrompt ?? existing.imagePrompt,
      videoPrompt: generated[i]?.videoPrompt ?? existing.videoPrompt,
    })));
    setAiPanelOpen(false);
  }, [aiChat.generatedPrompts]);

  const handleStartGeneration = async () => {
    const hasPrompts = clipDrafts.some(c => c.imagePrompt || c.videoPrompt);
    if (!hasPrompts) { setError('Please add at least one clip with prompts'); return; }
    await updateClips(clipDrafts);
    await startGeneration();
    setStep('generating');
  };

  // Move to compile when generation finishes (count-based fallback)
  useEffect(() => {
    if (gen.totalCount > 0 && gen.completedCount + gen.failedCount === gen.totalCount) {
      setStep('compile');
    }
  }, [gen.completedCount, gen.failedCount, gen.totalCount]);

  // Move to compile immediately on pipeline_completed event (most reliable trigger)
  // Also refresh project so finalVideoPath and status are up to date
  useEffect(() => {
    const lastEvent = gen.events[gen.events.length - 1];
    if (lastEvent?.type === 'pipeline_completed') {
      setStep('compile');
      if (project?.id) {
        loadProject(project.id);
      }
    }
  }, [gen.events]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle no_pipeline (server restart / stale state) — surface error and go back to clips
  useEffect(() => {
    if (gen.pipelineError && step === 'generating') {
      setError(gen.pipelineError);
      setStep('clips');
    }
  }, [gen.pipelineError, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const reviewClip = gen.pendingReview !== null
    ? gen.clips.find(c => c.index === gen.pendingReview)
    : null;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 24px 80px', position: 'relative', zIndex: 1 }}>

      {/* Page header */}
      <div className="animate-fade-up" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'var(--gold-dim)',
              border: '1px solid rgba(245,166,35,0.22)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={17} color="var(--gold)" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
                background: 'linear-gradient(120deg, var(--text) 0%, var(--gold-light) 55%, var(--gold) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Pixar AI Studio
            </h1>
            <div className="section-label" style={{ marginTop: 3 }}>
              Google Flow · Veo 3.1
            </div>
          </div>
        </div>
      </div>

      <div className="animate-fade-up delay-1">
        <AccountHealth />
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            background: 'var(--error-dim)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <p style={{ color: 'var(--error)', fontSize: 14, fontFamily: 'var(--font-body)' }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--error)',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--font-body)',
              opacity: 0.7,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Step: Edit Clips ── */}
      {step === 'clips' && (
        <div className="animate-fade-up delay-1" style={{ marginTop: 20 }}>
          {/* Sub-header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              gap: 16,
            }}
          >
            <button
              onClick={() => navigate('/projects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                padding: '4px 0',
                transition: 'color 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={13} strokeWidth={2} />
              All Projects
            </button>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 600,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                textAlign: 'center',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project?.name ?? ''}
            </h2>
            <div style={{ width: 80, flexShrink: 0 }} />
          </div>

          {/* Main editor layout: [ai panel | ] clips + canvas */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minHeight: 0 }}>

            {/* AI panel — left 1/3 sidebar */}
            {aiPanelOpen && (
              <div
                style={{
                  width: '33.333%',
                  flexShrink: 0,
                  position: 'sticky',
                  top: 'calc(var(--nav-h) + 12px)',
                  paddingRight: 16,
                }}
              >
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

            {/* Right side: clips + canvas */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'grid',
                gridTemplateColumns: '1fr 340px',
                gap: 16,
                alignItems: 'start',
              }}
            >
              {/* Clip editor column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
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
                  disabled={loading || !project}
                  className="btn-gold"
                  style={{ width: '100%', padding: '13px 24px', fontSize: 15, borderRadius: 10 }}
                >
                  <Play size={15} strokeWidth={2.5} />
                  {loading ? 'Saving…' : 'Start Generation'}
                </button>
              </div>

              {/* Video mockup canvas column */}
              {project && (
                <div style={{ position: 'sticky', top: 'calc(var(--nav-h) + 12px)' }}>
                  <VideoMockupCanvas settings={project.settings} onChange={updateSettings} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Step: Generating ── */}
      {step === 'generating' && project && (
        <div className="animate-fade-up delay-1" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} />
              All Projects
            </button>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              {project.name}
            </h2>
            <button
              onClick={() => abortGeneration()}
              className="btn-danger"
              style={{ padding: '6px 16px', fontSize: 13 }}
            >
              <Square size={13} strokeWidth={2.5} />
              Abort
            </button>
          </div>

          {gen.isCompiling && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 18px',
                marginBottom: 16,
                background: 'rgba(168,85,247,0.08)',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: 10,
                fontSize: 13,
                color: '#a855f7',
                fontFamily: 'var(--font-body)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{ flexShrink: 0 }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Compiling clips with borders and text overlay…
            </div>
          )}

          {reviewClip && <ImageReview clip={reviewClip} onSelect={selectImage} />}
          <ProgressDashboard
            clips={gen.clips}
            events={gen.events}
            progress={gen.progress}
            completedCount={gen.completedCount}
            failedCount={gen.failedCount}
            totalCount={gen.totalCount}
            connected={gen.connected}
          />
        </div>
      )}

      {/* ── Step: Compile ── */}
      {step === 'compile' && project && (
        <div className="animate-fade-up delay-1" style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
              }}
            >
              <ArrowLeft size={14} />
              All Projects
            </button>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--text)',
              }}
            >
              {project.name}
            </h2>
            <button
              onClick={() => setStep('clips')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 13,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
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
            finalVideoPath={gen.finalVideoPath ?? project.finalVideoPath}
            onCompile={compileVideo}
            loading={loading || gen.isCompiling}
            completedClipCount={
              gen.completedCount || project.clips.filter(c => c.status === 'completed').length
            }
          />
        </div>
      )}
    </div>
  );
}
