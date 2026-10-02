import express, { Request, Response, NextFunction } from 'express';
import {
  askChat,
  explainTopic,
  summarizeNotes,
  generateQuiz,
  transcribeAudio,
  ChatMessage,
} from './gemini';

export const apiRouter = express.Router();

// Parse JSON bodies
apiRouter.use(express.json({ limit: '10mb' }));

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Chat endpoint
apiRouter.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messages } = req.body as { messages?: ChatMessage[] };
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    const responseText = await askChat(messages);
    res.json({ text: responseText });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate chat response',
    });
  }
});

// Explain Topic endpoint
apiRouter.post('/explain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, difficulty, subject } = req.body as {
      topic?: string;
      difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
      subject?: string;
    };

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    const validDifficulty = difficulty || 'Intermediate';
    const result = await explainTopic(topic.trim(), validDifficulty, subject?.trim());
    res.json(result);
  } catch (error: any) {
    console.error('Explain topic error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to explain topic',
    });
  }
});

// Summarize Notes endpoint
apiRouter.post('/summarize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notes, style } = req.body as { notes?: string; style?: string };

    if (!notes || typeof notes !== 'string' || notes.trim() === '') {
      res.status(400).json({ error: 'Notes text is required' });
      return;
    }

    const result = await summarizeNotes(notes.trim(), style || 'comprehensive');
    res.json(result);
  } catch (error: any) {
    console.error('Summarize notes error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to summarize notes',
    });
  }
});

// Generate MCQ Quiz endpoint
apiRouter.post('/quiz', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, count, difficulty } = req.body as {
      topic?: string;
      count?: number;
      difficulty?: string;
    };

    if (!topic || typeof topic !== 'string' || topic.trim() === '') {
      res.status(400).json({ error: 'Topic is required' });
      return;
    }

    const questionCount = Number(count) || 5;
    const diff = difficulty || 'Intermediate';
    const result = await generateQuiz(topic.trim(), questionCount, diff);
    res.json(result);
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate quiz',
    });
  }
});

// Transcribe Audio endpoint (Speech-to-Text via Gemini)
apiRouter.post('/transcribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { audio, mimeType } = req.body as { audio?: string; mimeType?: string };
    if (!audio || typeof audio !== 'string' || audio.trim() === '') {
      res.status(400).json({ error: 'Audio data is required' });
      return;
    }

    const transcript = await transcribeAudio(audio.trim(), mimeType || 'audio/webm');
    res.json({ text: transcript });
  } catch (error: any) {
    console.error('Audio transcription error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to transcribe audio',
    });
  }
});

