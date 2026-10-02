import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI, Type } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment');
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Available model candidates in priority order (flash-lite has high limits & sub-second latency)
const MODEL_CANDIDATES = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];

async function executeWithModelFallback<T>(
  action: (ai: GoogleGenAI, model: string) => Promise<T>
): Promise<T> {
  const ai = getAiClient();
  let lastError: any = null;

  for (const model of MODEL_CANDIDATES) {
    try {
      return await action(ai, model);
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed, attempting fallback... Reason:`, err?.message || err);
      // If quota or transient error, continue to next candidate
      continue;
    }
  }

  throw lastError || new Error('Failed to generate response across all AI models');
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ExplainResponse {
  simpleExplanation: string;
  keyConcepts: string[];
  example: string;
  summary: string;
}

export interface SummarizeResponse {
  shortSummary: string;
  keyPoints: string[];
  importantTerms: Array<{ term: string; definition: string }>;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

export async function askChat(messages: ChatMessage[]): Promise<string> {
  const systemInstruction = `You are StudyGPT, a comprehensive, versatile, general-purpose AI study assistant for university, college, and secondary students.

CORE CAPABILITIES:
- You have deep, expert knowledge across ALL academic fields and subjects without any restriction:
  * Computer Science & AI (e.g. AI agents, algorithms, data structures, recursion, OOP, databases, networking, machine learning)
  * Programming (e.g. Java, Python, C++, JavaScript, Rust, SQL, debugging, polymorphism, design patterns)
  * Mathematics & Statistics (e.g. Bayes' theorem, calculus, linear algebra, discrete math, probability, statistics)
  * Natural Sciences (e.g. Biology, Photosynthesis, Genetics, Chemistry, Organic Chem, Physics, Thermodynamics, Neuroscience)
  * Cybersecurity & Information Security (e.g. phishing, cryptography, network protocols, penetration testing, malware analysis)
  * Engineering (e.g. TCP vs UDP, signal processing, electrical circuits, mechanical engineering, materials science)
  * Business & Economics (e.g. micro/macroeconomics, corporate finance, marketing, accounting, supply & demand)
  * Humanities & Social Sciences (e.g. History, Philosophy, Literature, Psychology, Sociology, Political Science)
  * General Academic Skills (e.g. "Explain this paragraph", simplifying complex texts for beginners, essay outlining)

BEHAVIORAL GUIDELINES:
- Dynamically answer whatever question or topic the student provides with academic rigor, clarity, and depth.
- Students can freely switch between completely unrelated subjects at any point in the conversation. Seamlessly adapt to each new topic.
- Format responses cleanly with Markdown:
  * Use bold headers (##, ###) and organized sections
  * Highlight key terms in **bold**
  * Use numbered steps or bullet lists for clarity
  * Format code blocks with appropriate language tags
  * Format mathematical formulas and notation cleanly
- Maintain an encouraging, intellectual, and supportive mentor tone.`;

  const formattedContents = messages.map((msg) => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  return await executeWithModelFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
      contents: formattedContents,
      config: {
        systemInstruction,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response received from AI model');
    }
    return text;
  });
}

export async function explainTopic(
  topic: string,
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced',
  subject?: string
): Promise<ExplainResponse> {
  const prompt = `You are StudyGPT. Provide a detailed, high-yield academic explanation for the following topic:
Topic: "${topic}"
Target Difficulty Level: ${difficulty}
${subject ? `Subject/Discipline: ${subject}` : ''}

Explain this topic accurately and thoroughly based on the requested difficulty level.
Include:
1. simpleExplanation: A clear, engaging explanation written specifically for the target difficulty level.
2. keyConcepts: An array of 3 to 6 essential principles or core concepts the student must understand for exams.
3. example: A concrete, intuitive, real-world example, scenario, or code snippet (if technical) illustrating the topic.
4. summary: A crisp 1-2 sentence recap.`;

  return await executeWithModelFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            simpleExplanation: {
              type: Type.STRING,
              description: 'Clear, intuitive explanation tailored to the requested difficulty level.',
            },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 3 to 6 key concepts or core principles.',
            },
            example: {
              type: Type.STRING,
              description: 'A concrete real-world scenario or intuitive analogy illustrating the concept.',
            },
            summary: {
              type: Type.STRING,
              description: 'A concise 1-2 sentence recap.',
            },
          },
          required: ['simpleExplanation', 'keyConcepts', 'example', 'summary'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No content returned from AI');
    }

    return JSON.parse(text) as ExplainResponse;
  });
}

export async function summarizeNotes(
  notes: string,
  style: string = 'comprehensive'
): Promise<SummarizeResponse> {
  const prompt = `You are StudyGPT. Analyze and summarize the following student notes or study material:
Summary Style: ${style}

STUDY MATERIAL:
"""
${notes}
"""

Synthesize this material into:
1. shortSummary: A concise, insightful overview paragraph summarizing the core ideas.
2. keyPoints: An array of 4 to 8 high-yield takeaways and critical points for study revision.
3. importantTerms: An array of key academic terms or specialized vocabulary with concise definitions.`;

  return await executeWithModelFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortSummary: {
              type: Type.STRING,
              description: 'Concise overview of the provided notes.',
            },
            keyPoints: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Array of high-yield revision bullet points.',
            },
            importantTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
              description: 'Glossary of key terminology with definitions.',
            },
          },
          required: ['shortSummary', 'keyPoints', 'importantTerms'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No content returned from AI');
    }

    return JSON.parse(text) as SummarizeResponse;
  });
}

export async function generateQuiz(
  topicOrNotes: string,
  count: number = 5,
  difficulty: string = 'Intermediate'
): Promise<QuizResponse> {
  const safeCount = Math.min(Math.max(count, 3), 15);

  const prompt = `You are StudyGPT. Generate a university-level multiple-choice quiz based on the following academic topic or study material:
"${topicOrNotes}"

Number of questions: ${safeCount}
Difficulty Level: ${difficulty}

Requirements:
- Questions must be academically rigorous and directly relevant to the topic or material provided.
- Provide exactly 4 distinct and plausible options for each question (only one unequivocally correct).
- Provide correctIndex (0 for option 1, 1 for option 2, 2 for option 3, 3 for option 4).
- Provide an educational explanation detailing why the correct answer is right and why other options are incorrect.`;

  return await executeWithModelFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exactly 4 distinct choices.',
                  },
                  correctIndex: {
                    type: Type.INTEGER,
                    description: 'Zero-based index (0, 1, 2, or 3) of the correct answer.',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Educational explanation of the correct answer.',
                  },
                },
                required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
              },
            },
          },
          required: ['questions'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('No quiz generated');
    }

    const parsed = JSON.parse(text) as QuizResponse;
    parsed.questions = parsed.questions.map((q, idx) => ({
      ...q,
      id: idx + 1,
    }));

    return parsed;
  });
}

export async function transcribeAudio(
  base64Audio: string,
  mimeType: string = 'audio/webm'
): Promise<string> {
  const prompt = `You are a speech-to-text transcriber for academic study questions.
Transcribe the user's spoken voice recording accurately and verbatim into standard plain text.
- Do NOT add quotation marks, preambles, notes, or conversational filler.
- Do NOT answer the question. Only transcribe what the user said.
- If the audio contains no discernible speech, silence, background static only, or is empty, return an empty string.`;

  // Normalize mime type (strip codec parameters if present)
  const cleanMimeType = mimeType.split(';')[0].trim() || 'audio/webm';

  return await executeWithModelFallback(async (ai, model) => {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMimeType,
                data: base64Audio,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const text = response.text?.trim() || '';
    if (text === '[NO_SPEECH]' || text === '""' || text.toLowerCase() === 'no speech detected.') {
      return '';
    }
    return text;
  });
}
