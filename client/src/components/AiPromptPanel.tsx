import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { Wand2, RefreshCw, Send, CheckCircle, AlertCircle } from 'lucide-react';
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

function phaseLabel(phase: InterviewPhase, messageCount: number): string {
  switch (phase) {
    case 'idle':
      return 'Ready to start';
    case 'interviewing': {
      const assistantTurns = Math.max(0, Math.ceil(messageCount / 2));
      return `Interviewing (${Math.min(assistantTurns, 4)} of ~4 questions)`;
    }
    case 'complete':
      return 'Interview complete — review and apply';
    case 'error':
      return 'Error — type a message to retry';
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
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
    onSend('');
  };

  const sendDisabled = loading || phase === 'complete' || !input.trim();

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-sm text-gray-800">AI Prompt Assistant</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          title="Reset conversation"
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Phase indicator */}
      <div
        className={`px-4 py-2 text-xs font-medium border-b border-gray-100 ${
          phase === 'complete'
            ? 'text-green-700 bg-green-50'
            : phase === 'error'
            ? 'text-red-700 bg-red-50'
            : 'text-purple-700 bg-purple-50'
        }`}
      >
        {phase === 'complete' && <CheckCircle className="w-3 h-3 inline mr-1" />}
        {phase === 'error' && <AlertCircle className="w-3 h-3 inline mr-1" />}
        {phaseLabel(phase, messages.length)}
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && phase === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-gray-400">
            <Wand2 className="w-8 h-8 text-purple-300" />
            <p className="text-sm">
              Chat with AI to auto-generate image &amp; video prompts for all your clips.
            </p>
            <button
              type="button"
              onClick={handleStartInterview}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Start Interview
            </button>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl'
                  : 'bg-gray-100 text-gray-800 rounded-tr-xl rounded-bl-xl rounded-br-xl'
              }`}
            >
              {/* Strip the JSON code fence from assistant messages for cleaner display */}
              {msg.role === 'assistant'
                ? msg.content.replace(/```json[\s\S]*?```/g, '[Prompts generated]').trim()
                : msg.content}
            </div>
          </div>
        ))}

        {/* Loading pulse */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-tr-xl rounded-bl-xl rounded-br-xl px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {phase !== 'idle' && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || phase === 'complete'}
              placeholder={phase === 'complete' ? 'Interview complete' : 'Type your answer… (Enter to send)'}
              rows={2}
              className="flex-1 resize-none text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sendDisabled}
              className="flex-shrink-0 p-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Apply button — only when complete */}
      {hasGeneratedPrompts && phase === 'complete' && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={onApplyPrompts}
            className="w-full py-2.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Apply Prompts to Clips
          </button>
        </div>
      )}
    </div>
  );
}
