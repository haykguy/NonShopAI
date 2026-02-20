import { Router } from 'express';
import { getProject } from './projects';
import { llmAdapter, buildSystemPrompt, ChatMessage } from '../services/chatService';
import { logger } from '../utils/logger';

function paramStr(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

const router = Router();

// POST /api/projects/:id/chat
// Stateless: client sends full conversation history on every request.
router.post('/:id/chat', async (req, res, next) => {
  try {
    const project = getProject(paramStr(req.params.id));
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: 'messages must be an array' });
      return;
    }

    // Validate each message has role and content
    for (const msg of messages) {
      if (
        typeof msg !== 'object' ||
        !['user', 'assistant', 'system'].includes(msg.role) ||
        typeof msg.content !== 'string'
      ) {
        res.status(400).json({ error: 'Each message must have a valid role and string content' });
        return;
      }
    }

    const systemPrompt = buildSystemPrompt({
      projectTitle: project.name,
      clipCount: project.clips.length,
      existingPrompts: project.clips.map(c => ({
        imagePrompt: c.imagePrompt,
        videoPrompt: c.videoPrompt,
      })),
    });

    const typedMessages = messages as ChatMessage[];
    logger.info(`Chat turn for project ${project.id}, ${typedMessages.length} messages in history`);

    const response = await llmAdapter.chat({ systemPrompt, messages: typedMessages });
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
