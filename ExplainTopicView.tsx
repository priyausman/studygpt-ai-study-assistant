import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  MessageSquare,
  Lightbulb,
  Layers,
  FlaskConical,
  BookmarkCheck,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { DifficultyLevel, ExplainResult } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ExplainTopicViewProps {
  onStartQuizWithTopic: (topic: string, difficulty: DifficultyLevel) => void;
  onAskInChat: (prompt: string) => void;
  onActivityLogged: (item: { title: string; subtitle: string; targetTab: 'explain' }) => void;
  defaultDifficulty: DifficultyLevel;
}

export const ExplainTopicView: React.FC<ExplainTopicViewProps> = ({
  onStartQuizWithTopic,
  onAskInChat,
  onActivityLogged,
  defaultDifficulty,
}) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(defaultDifficulty || 'Intermediate');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleTopics = [
    { name: 'AI Agents', subject: 'Artificial Intelligence' },
    { name: 'Photosynthesis', subject: 'Biology' },
    { name: "Bayes' Theorem", subject: 'Mathematics' },
    { name: 'Polymorphism in Java', subject: 'Computer Science' },
    { name: 'Phishing Attacks', subject: 'Cybersecurity' },
    { name: 'TCP vs UDP', subject: 'Computer Networks' },
  ];

  const handleExplain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          subject: subject.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: ExplainResult = await response.json();
      const completeResult: ExplainResult = {
        ...data,
        topic: topic.trim(),
        difficulty,
        subject: subject.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      setResult(completeResult);
      onActivityLogged({
        title: `Explain: ${topic.trim()}`,
        subtitle: `${difficulty} breakdown with key concepts & example`,
        targetTab: 'explain',
      });
    } catch (err: any) {
      console.error('Failed to explain topic:', err);
      setError(err?.message || 'Failed to explain topic. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `TOPIC: ${result.topic} (${result.difficulty} Level)
${result.subject ? `Subject: ${result.subject}\n` : ''}
SIMPLE EXPLANATION:
${result.simpleExplanation}

KEY CONCEPTS:
${result.keyConcepts.map((k, i) => `${i + 1}. ${k}`).join('\n')}

REAL-WORLD EXAMPLE:
${result.example}

SUMMARY:
${result.summary}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 text-indigo-600 mb-1.5">
          <BookOpen className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Concept Comprehension</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explain a Topic
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Enter <strong>ANY academic topic or theorem</strong> from any field to get a dynamic, crystal-clear breakdown tailored to your difficulty level.
        </p>
      </div>

      {/* Input Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
        <form onSubmit={handleExplain} className="space-y-5">
          {/* Topic Input */}
          <div>
            <label htmlFor="topic-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Topic or Theorem (Any Academic Field)
            </label>
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI agents, Photosynthesis, Bayes' theorem, Polymorphism in Java, Phishing..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Quick topic pills */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">Try an example topic:</span>
            <div className="flex flex-wrap gap-2">
              {sampleTopics.map((st, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setTopic(st.name);
                    setSubject(st.subject);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                >
                  {st.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty and Subject row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as DifficultyLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                      difficulty === level
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Subject */}
            <div>
              <label htmlFor="subject-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Subject / Discipline <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                id="subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Computer Science, Biology, Economics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!topic.trim() || isLoading}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                topic.trim() && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Explanation...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Explain Topic</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Output */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Action Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{result.topic}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {result.difficulty}
                </span>
                {result.subject && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {result.subject}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">Generated by StudyGPT AI</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onStartQuizWithTopic(result.topic, result.difficulty)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Quiz Me on This</span>
              </button>

              <button
                type="button"
                onClick={() => onAskInChat(`I'm studying ${result.topic}. Can you give me more details on ${result.keyConcepts[0] || 'the key concepts'}?`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ask in Chat</span>
              </button>
            </div>
          </div>

          {/* Section 1: Simple Explanation */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-3">
              <Lightbulb className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Simple Explanation</h3>
            </div>
            <div className="text-slate-700 text-sm sm:text-base leading-relaxed">
              <MarkdownRenderer content={result.simpleExplanation} />
            </div>
          </div>

          {/* Section 2: Key Concepts */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-3">
              <Layers className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Key Concepts</h3>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {result.keyConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed font-medium">
                    <MarkdownRenderer content={concept} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Example */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-3">
              <FlaskConical className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Real-World / Intuitive Example</h3>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/40 border border-indigo-100 text-slate-700 text-sm sm:text-base leading-relaxed">
              <MarkdownRenderer content={result.example} />
            </div>
          </div>

          {/* Section 4: Short Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center gap-2.5 text-indigo-600 mb-3">
              <BookmarkCheck className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Short Summary</h3>
            </div>
            <div className="text-slate-700 text-sm sm:text-base leading-relaxed">
              <MarkdownRenderer content={result.summary} />
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <p className="text-xs text-center text-slate-400 pt-2">
        StudyGPT can make mistakes. Verify important information with your course materials.
      </p>
    </div>
  );
};
