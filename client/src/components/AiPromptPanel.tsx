import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import {
  Wand2, RefreshCw, Send, CheckCircle, AlertCircle,
  ChevronDown, Lightbulb, Film, Palette, Zap, MessageSquare,
} from 'lucide-react';
import type { ChatMessageClient, InterviewPhase } from '../hooks/useAiChat';

interface AiPromptPanelProps {
  messages: ChatMessageClient[];
  phase: InterviewPhase;
  loading: boolean;
  error: string | null;
  onSend: (text: string) => void;
  onReset: () => void;
  onApplyPrompts: () => void;
  hasGeneratedPrompts: boolean;
}

const STYLES = [
  { id: 'pixar', label: 'Pixar 3D', icon: '🎬' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎞️' },
  { id: 'anime', label: 'Anime', icon: '✨' },
  { id: 'photorealistic', label: 'Photoreal', icon: '📷' },
  { id: 'watercolor', label: 'Watercolor', icon: '🎨' },
  { id: 'minimalist', label: 'Minimal', icon: '⬜' },
];

const TONES = [
  { id: 'epic', label: 'Epic' },
  { id: 'playful', label: 'Playful' },
  { id: 'dramatic', label: 'Dramatic' },
  { id: 'serene', label: 'Serene' },
  { id: 'mysterious', label: 'Mysterious' },
];

const QUICK_PROMPTS = [
  { icon: <Film size={12} />, text: 'Product showcase' },
  { icon: <Lightbulb size={12} />, text: 'Brand story' },
  { icon: <Zap size={12} />, text: 'Action & energy' },
  { icon: <Palette size={12} />, text: 'Nature & beauty' },
  { icon: <MessageSquare size={12} />, text: 'Testimonial style' },
];

function phaseLabel(phase: InterviewPhase, messageCount: number): string {
  switch (phase) {
    case 'idle': return 'Ready to start';
    case 'interviewing': {
      const assistantTurns = Math.max(0, Math.ceil(messageCount / 2));
      return `Interviewing (${Math.min(assistantTurns, 4)} of ~4 questions)`;
    }
    case 'complete': return 'Interview complete — review and apply';
    case 'error': return 'Error — type a message to retry';
  }
}

export function AiPromptPanel({
  messages,
  phase,
  loading,
  error,
  onSend,
  onReset,
  onApplyPrompts,
  hasGeneratedPrompts,
}: AiPromptPanelProps) {
  const [input, setInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('pixar');
  const [selectedTone, setSelectedTone] = useState('epic');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || phase === 'complete') return;
    setInput('');
    onSend(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStartInterview = () => {
    const contextPrefix = `Style: ${selectedStyle}, Tone: ${selectedTone}. `;
    onSend(contextPrefix);
  };

  const handleQuickPrompt = (text: string) => {
    if (phase === 'idle') {
      const contextPrefix = `Style: ${selectedStyle}, Tone: ${selectedTone}. Topic: ${text}. `;
      onSend(contextPrefix);
    } else {
      setInput(prev => prev ? `${prev} ${text}` : text);
      textareaRef.current?.focus();
    }
  };

  const sendDisabled = loading || phase === 'complete' || !input.trim();

  const phaseColor = phase === 'complete'
    ? 'var(--success)'
    : phase === 'error'
    ? 'var(--error)'
    : 'var(--blue)';

  const phaseBg = phase === 'complete'
    ? 'var(--success-dim)'
    : phase === 'error'
    ? 'var(--error-dim)'
    : 'var(--blue-dim)';

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--nav-h) - 80px)',
        minHeight: 600,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 18px',
          borderBottom: '1px solid var(--separator)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--gold-dim)',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Wand2 size={16} color="var(--gold)" strokeWidth={2} />
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 14,
                color: 'var(--text)',
                letterSpacing: '-0.015em',
              }}
            >
              AI Prompt Assistant
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
              Powered by Claude
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={() => setSettingsOpen(o => !o)}
            title="Style settings"
            style={{
              height: 30,
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: settingsOpen ? 'var(--gold-dim)' : 'var(--glass-bg)',
              border: `1px solid ${settingsOpen ? 'rgba(245,166,35,0.25)' : 'var(--border)'}`,
              borderRadius: 8,
              cursor: 'pointer',
              color: settingsOpen ? 'var(--gold)' : 'var(--text-muted)',
              fontSize: 11,
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          >
            <Palette size={12} strokeWidth={2} />
            Style
            <ChevronDown
              size={11}
              strokeWidth={2}
              style={{
                transform: settingsOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Reset conversation"
            style={{
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
          >
            <RefreshCw size={13} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Style/Tone settings panel */}
      {settingsOpen && (
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--separator)',
            background: 'var(--glass-bg)',
            flexShrink: 0,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Visual Style
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStyle(s.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: `1px solid ${selectedStyle === s.id ? 'rgba(245,166,35,0.4)' : 'var(--border)'}`,
                    background: selectedStyle === s.id ? 'var(--gold-dim)' : 'var(--glass-bg)',
                    color: selectedStyle === s.id ? 'var(--gold)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    fontWeight: selectedStyle === s.id ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Tone
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {TONES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTone(t.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 20,
                    border: `1px solid ${selectedTone === t.id ? 'rgba(10,132,255,0.4)' : 'var(--border)'}`,
                    background: selectedTone === t.id ? 'var(--blue-dim)' : 'var(--glass-bg)',
                    color: selectedTone === t.id ? 'var(--blue)' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontFamily: 'var(--font-body)',
                    fontWeight: selectedTone === t.id ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Phase indicator */}
      <div
        style={{
          padding: '8px 18px',
          background: phaseBg,
          borderBottom: '1px solid var(--separator)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        {phase === 'complete' && <CheckCircle size={11} color={phaseColor} />}
        {phase === 'error' && <AlertCircle size={11} color={phaseColor} />}
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'var(--font-body)',
            color: phaseColor,
            letterSpacing: '0.01em',
          }}
        >
          {phaseLabel(phase, messages.length)}
        </span>
      </div>

      {/* Quick prompts */}
      <div
        style={{
          padding: '10px 18px',
          borderBottom: '1px solid var(--separator)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
          Quick Start
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {QUICK_PROMPTS.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickPrompt(qp.text)}
              disabled={phase === 'complete'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--glass-bg)',
                color: 'var(--text-secondary)',
                fontSize: 11,
                fontFamily: 'var(--font-body)',
                cursor: phase === 'complete' ? 'not-allowed' : 'pointer',
                opacity: phase === 'complete' ? 0.4 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (phase !== 'complete') {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
            >
              {qp.icon}
              {qp.text}
            </button>
          ))}
        </div>
      </div>

      {/* Message list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {messages.length === 0 && phase === 'idle' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 16,
              textAlign: 'center',
              padding: '32px 24px',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                background: 'var(--gold-dim)',
                border: '1px solid rgba(245, 166, 35, 0.2)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wand2 size={26} color="var(--gold)" strokeWidth={1.8} />
            </div>
            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  marginBottom: 6,
                }}
              >
                AI Prompt Generator
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: 1.6,
                  maxWidth: 220,
                }}
              >
                I'll interview you about your video concept and generate cinematic prompts for all your clips.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 240 }}>
              <button
                type="button"
                onClick={handleStartInterview}
                className="btn-gold"
                style={{ fontSize: 14, padding: '11px 20px', width: '100%' }}
              >
                <Wand2 size={14} strokeWidth={2} />
                Start Interview
              </button>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-body)' }}>
                Or pick a quick start above
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {msg.role === 'assistant' && (
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'var(--gold-dim)',
                  border: '1px solid rgba(245,166,35,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginRight: 8,
                  marginTop: 4,
                }}
              >
                <Wand2 size={11} color="var(--gold)" strokeWidth={2} />
              </div>
            )}
            <div
              style={{
                maxWidth: '78%',
                padding: '10px 14px',
                fontSize: 13,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'var(--font-body)',
                ...(msg.role === 'user'
                  ? {
                      background: 'var(--blue)',
                      color: '#fff',
                      borderRadius: '14px 14px 4px 14px',
                    }
                  : {
                      background: 'var(--glass-bg-heavy)',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px 14px 14px 14px',
                    }),
              }}
            >
              {msg.role === 'assistant'
                ? msg.content.replace(/```json[\s\S]*?```/g, '[Prompts generated ✓]').trim()
                : msg.content}
            </div>
          </div>
        ))}

        {/* Loading pulse */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 8 }}>
            <div
              style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'var(--gold-dim)',
                border: '1px solid rgba(245,166,35,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 4,
              }}
            >
              <Wand2 size={11} color="var(--gold)" strokeWidth={2} />
            </div>
            <div
              style={{
                background: 'var(--glass-bg-heavy)',
                border: '1px solid var(--border)',
                borderRadius: '4px 14px 14px 14px',
                padding: '12px 16px',
              }}
            >
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--text-muted)', display: 'block',
                      animation: `pulse-dot 1.4s ease ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              fontSize: 12, color: 'var(--error)',
              background: 'var(--error-dim)',
              border: '1px solid rgba(255, 69, 58, 0.18)',
              borderRadius: 8, padding: '10px 14px',
              fontFamily: 'var(--font-body)',
            }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Apply button */}
      {hasGeneratedPrompts && phase === 'complete' && (
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--separator)',
            flexShrink: 0,
            background: 'var(--success-dim)',
          }}
        >
          <div style={{ fontSize: 12, color: 'var(--success)', fontFamily: 'var(--font-body)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={12} strokeWidth={2} />
            Prompts ready for all clips
          </div>
          <button
            type="button"
            onClick={onApplyPrompts}
            className="btn-gold"
            style={{ width: '100%', padding: '12px 0', fontSize: 14 }}
          >
            <CheckCircle size={15} strokeWidth={2} />
            Apply Prompts to All Clips
          </button>
        </div>
      )}

      {/* Input area */}
      {phase !== 'idle' && phase !== 'complete' && (
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid var(--separator)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              placeholder="Type your answer… (Enter to send)"
              rows={2}
              style={{
                flex: 1, resize: 'none', fontSize: 13,
                fontFamily: 'var(--font-body)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 13px',
                color: 'var(--text)', outline: 'none',
                transition: 'border-color 0.15s',
                letterSpacing: '-0.005em', lineHeight: 1.5,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--gold)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sendDisabled}
              style={{
                width: 38, height: 38,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: sendDisabled ? 'var(--glass-bg)' : 'var(--blue)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                cursor: sendDisabled ? 'not-allowed' : 'pointer',
                color: sendDisabled ? 'var(--text-muted)' : '#fff',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </div>
          <p style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-body)', marginTop: 6, textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}
    </div>
  );
}
