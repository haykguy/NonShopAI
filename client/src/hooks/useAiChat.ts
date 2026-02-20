import { useState, useCallback } from 'react';
import { api } from './useApi';

export interface ChatMessageClient {
  role: 'user' | 'assistant';
  content: string;
}

export type InterviewPhase = 'idle' | 'interviewing' | 'complete' | 'error';

export interface GeneratedPrompt {
  imagePrompt: string;
  videoPrompt: string;
}

interface ChatApiResponse {
  message: string;
  generatedPrompts?: GeneratedPrompt[];
}

interface UseAiChatOptions {
  projectId: string | null;
  projectTitle: string;
  clipCount: number;
  existingPrompts: Array<{ imagePrompt: string; videoPrompt: string }>;
}

export function useAiChat({
  projectId,
  projectTitle,
  clipCount,
  existingPrompts,
}: UseAiChatOptions) {
  const [messages, setMessages] = useState<ChatMessageClient[]>([]);
  const [phase, setPhase] = useState<InterviewPhase>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt[] | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!projectId || loading) return;

      // Build next message list — if userText is empty (initial trigger), only send
      // an empty user message to kick off the interview opening question.
      const userMsg: ChatMessageClient = { role: 'user', content: userText };
      const nextMessages = userText.trim()
        ? [...messages, userMsg]
        : messages.length === 0
        ? []  // first trigger: send empty history so server asks first question
        : messages;

      // For the initial trigger with no user input, don't append a user bubble
      const displayMessages = userText.trim()
        ? [...messages, userMsg]
        : messages;

      if (userText.trim()) {
        setMessages(displayMessages);
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.post<ChatApiResponse>(`/projects/${projectId}/chat`, {
          messages: nextMessages,
          projectContext: {
            title: projectTitle,
            clipCount,
            existingPrompts,
          },
        });

        const assistantMsg: ChatMessageClient = {
          role: 'assistant',
          content: response.message,
        };

        setMessages(prev =>
          userText.trim()
            ? [...prev, assistantMsg]
            : [assistantMsg],
        );

        if (response.generatedPrompts && response.generatedPrompts.length > 0) {
          setGeneratedPrompts(response.generatedPrompts);
          setPhase('complete');
        } else {
          setPhase('interviewing');
        }
      } catch (err: any) {
        setError(err.message ?? 'Failed to get AI response');
        setPhase('error');
      } finally {
        setLoading(false);
      }
    },
    [projectId, messages, loading, projectTitle, clipCount, existingPrompts],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setPhase('idle');
    setLoading(false);
    setError(null);
    setGeneratedPrompts(null);
  }, []);

  return {
    messages,
    phase,
    loading,
    error,
    generatedPrompts,
    sendMessage,
    reset,
  };
}
