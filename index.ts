export type TabType = 'dashboard' | 'chat' | 'explain' | 'summarize' | 'quiz';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface ExplainResult {
  topic: string;
  difficulty: DifficultyLevel;
  subject?: string;
  simpleExplanation: string;
  keyConcepts: string[];
  example: string;
  summary: string;
  timestamp: string;
}

export interface SummaryResult {
  id: string;
  title: string;
  shortSummary: string;
  keyPoints: string[];
  importantTerms: Array<{ term: string; definition: string }>;
  originalNotes: string;
  timestamp: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  topic: string;
  difficulty: DifficultyLevel;
  questions: QuizQuestion[];
  userAnswers: Record<number, number>; // questionId -> selectedOptionIndex
  score: number;
  totalQuestions: number;
  percentage: number;
  completedAt: string;
}

export interface RecentActivityItem {
  id: string;
  type: 'chat' | 'explain' | 'summarize' | 'quiz';
  title: string;
  subtitle: string;
  timestamp: string;
  targetTab: TabType;
  metadata?: any;
}

export interface UserPreferences {
  studyLevel: 'Undergraduate' | 'Graduate' | 'High School';
  defaultDifficulty: DifficultyLevel;
}
