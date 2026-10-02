import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Plus,
  Loader2,
  AlertCircle,
  MessageSquare,
  Trophy,
  Award,
  ChevronRight,
} from 'lucide-react';
import { DifficultyLevel, QuizQuestion, QuizAttempt } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface QuizViewProps {
  initialTopic?: string;
  initialDifficulty?: DifficultyLevel;
  onActivityLogged: (item: { title: string; subtitle: string; targetTab: 'quiz' }) => void;
  onAskInChat: (prompt: string) => void;
  defaultDifficulty: DifficultyLevel;
}

export const QuizView: React.FC<QuizViewProps> = ({
  initialTopic,
  initialDifficulty,
  onActivityLogged,
  onAskInChat,
  defaultDifficulty,
}) => {
  const [topic, setTopic] = useState(initialTopic || '');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty || defaultDifficulty || 'Intermediate');
  
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Sync if initialTopic changes from parent (e.g. from Explain or Dashboard)
  useEffect(() => {
    if (initialTopic) {
      setTopic(initialTopic);
    }
  }, [initialTopic]);

  const sampleQuizTopics = [
    'AI Agents & Autonomy',
    'Photosynthesis',
    "Bayes' Theorem",
    'Polymorphism in Java',
    'Phishing & Cyber Attacks',
    'TCP vs UDP Protocols',
  ];

  const handleGenerateQuiz = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setIsSubmitted(false);
    setSelectedAnswers({});
    setQuestions([]);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          count: questionCount,
          difficulty,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Server returned ${response.status}`);
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions returned by AI');
      }

      setQuestions(data.questions);
    } catch (err: any) {
      console.error('Quiz generation failed:', err);
      setError(err?.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleSubmitQuiz = () => {
    if (questions.length === 0) return;

    let score = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score++;
      }
    });

    setQuizScore(score);
    setIsSubmitted(true);

    const percentage = Math.round((score / questions.length) * 100);
    onActivityLogged({
      title: `MCQ Quiz: ${topic}`,
      subtitle: `Score: ${score}/${questions.length} (${percentage}%) • ${difficulty}`,
      targetTab: 'quiz',
    });

    // Scroll smoothly to score summary
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTryAgain = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setQuizScore(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewQuiz = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setIsSubmitted(false);
    setQuizScore(0);
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const percentage = questions.length > 0 ? Math.round((quizScore / questions.length) * 100) : 0;

  const optionLetters = ['A', 'B', 'C', 'D'];

  const getScoreFeedback = () => {
    if (percentage >= 90) {
      return {
        title: 'Outstanding Mastery!',
        message: 'You demonstrated an exceptional understanding of this material.',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        badge: 'Top Tier',
      };
    }
    if (percentage >= 70) {
      return {
        title: 'Great Performance!',
        message: 'You have a solid grasp of core principles. Review the missed items below to reinforce your knowledge.',
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200',
        badge: 'Proficient',
      };
    }
    if (percentage >= 50) {
      return {
        title: 'Good Effort!',
        message: 'You understand the basics, but some key technical nuances need a second look.',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        badge: 'Developing',
      };
    }
    return {
      title: 'Keep Practicing!',
      message: 'This topic has tricky concepts. Take time to read each explanation thoroughly below.',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      badge: 'Needs Review',
    };
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 text-indigo-600 mb-1.5">
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Exam Readiness</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Generate MCQs
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Create multiple-choice practice quizzes on <strong>ANY academic topic or pasted study material</strong> with dynamic AI questions, instant scoring, and in-depth rationales.
        </p>
      </div>

      {/* Quiz Setup Card */}
      {questions.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-5">
          <form onSubmit={handleGenerateQuiz} className="space-y-5">
            {/* Topic or Study Material Input */}
            <div>
              <label htmlFor="quiz-topic-input" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Academic Topic or Paste Study Material
              </label>
              <textarea
                id="quiz-topic-input"
                rows={2}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter ANY topic (e.g. AI agents, Photosynthesis, Bayes' theorem, Polymorphism in Java, Phishing) or paste notes/material here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all resize-y"
              />
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="text-xs font-semibold text-slate-400 block mb-2">
                Quick sample topics:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleQuizTopics.map((st, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTopic(st)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-xs text-slate-700 hover:text-indigo-700 font-medium transition-colors cursor-pointer"
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Row: Count & Difficulty */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              {/* Question Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
                        questionCount === cnt
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
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
                      className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center cursor-pointer ${
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
            </div>

            {/* Generate Button */}
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
                    <span>Generating Multiple-Choice Quiz...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Quiz</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Quiz or Results View */}
      {questions.length > 0 && (
        <div className="space-y-6">
          {/* Top Bar with Quiz Info / Score */}
          {isSubmitted ? (
            /* Results Banner */
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-2xl border border-indigo-100 shadow-2xs">
                    {percentage}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900">
                        {getScoreFeedback().title}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {getScoreFeedback().badge}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {getScoreFeedback().message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTryAgain}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span>Try Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNewQuiz}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Quiz</span>
                  </button>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Score
                  </span>
                  <span className="text-lg font-bold text-slate-800">
                    {quizScore} / {questions.length}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Accuracy
                  </span>
                  <span className="text-lg font-bold text-indigo-600">{percentage}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Difficulty
                  </span>
                  <span className="text-lg font-bold text-slate-800">{difficulty}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Quiz Active Header */
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{topic}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {difficulty} Level • {questions.length} Questions
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-600">
                  <span className="text-indigo-600 font-bold">{answeredCount}</span> of {questions.length} answered
                </div>
                <button
                  type="button"
                  onClick={handleNewQuiz}
                  className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Question Cards */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => {
              const userAnswer = selectedAnswers[q.id];
              const hasAnswered = userAnswer !== undefined;
              const isCorrect = isSubmitted && userAnswer === q.correctIndex;
              const isWrong = isSubmitted && hasAnswered && userAnswer !== q.correctIndex;
              const isUnanswered = isSubmitted && !hasAnswered;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border transition-all p-6 shadow-xs ${
                    isSubmitted
                      ? isCorrect
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : isWrong
                        ? 'border-rose-200 bg-rose-50/10'
                        : 'border-amber-200 bg-amber-50/10'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Question Title */}
                  <div className="flex items-start gap-3 mb-4">
                    <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {qIndex + 1}
                    </span>
                    <div className="flex-1 font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      <MarkdownRenderer content={q.question} />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="space-y-2.5 pl-0 sm:pl-10">
                    {q.options.map((option, optIdx) => {
                      const isSelected = userAnswer === optIdx;
                      const isOptionCorrect = q.correctIndex === optIdx;

                      let optionClasses = 'border-slate-200 hover:bg-slate-50 text-slate-700';

                      if (!isSubmitted) {
                        if (isSelected) {
                          optionClasses = 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-1 ring-indigo-600';
                        }
                      } else {
                        // In review mode
                        if (isOptionCorrect) {
                          optionClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                        } else if (isSelected && !isOptionCorrect) {
                          optionClasses = 'border-rose-400 bg-rose-50 text-rose-950 line-through';
                        } else {
                          optionClasses = 'border-slate-200 text-slate-400 opacity-60';
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(q.id, optIdx)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${optionClasses}`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                              isSubmitted
                                ? isOptionCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : isSelected
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-slate-100 text-slate-500'
                                : isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {optionLetters[optIdx]}
                          </div>

                          <div className="flex-1 text-sm leading-relaxed">
                            {option}
                          </div>

                          {isSubmitted && isOptionCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          )}
                          {isSubmitted && isSelected && !isOptionCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Review Explanation */}
                  {isSubmitted && (
                    <div className="mt-4 pt-3.5 border-t border-slate-100 sm:ml-10">
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed">
                        <span className="font-bold text-slate-900 block mb-1">
                          Rationale & Explanation:
                        </span>
                        <MarkdownRenderer content={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submit Quiz Action Bar */}
          {!isSubmitted && (
            <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-lg p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-600 font-medium">
                {answeredCount < questions.length ? (
                  <span className="text-amber-600 font-semibold">
                    Note: You have {questions.length - answeredCount} unanswered questions remaining.
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    All {questions.length} questions completed! Ready to submit.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  disabled={answeredCount === 0}
                  className={`px-8 py-2.5 rounded-xl font-bold text-sm shadow-xs transition-all ${
                    answeredCount > 0
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          )}

          {/* Post Submission Bottom Actions */}
          {isSubmitted && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Need help reviewing these concepts?</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Discuss the tricky points directly with StudyGPT in interactive chat.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTryAgain}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Try Again</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onAskInChat(
                      `I just completed an MCQ quiz on ${topic} at ${difficulty} level and scored ${quizScore}/${questions.length}. Can you guide me through the main core principles to master this subject?`
                    )
                  }
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discuss in Chat</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Academic Disclaimer Note */}
      <p className="text-xs text-center text-slate-400 pt-2">
        StudyGPT can make mistakes. Verify important information with your course materials.
      </p>
    </div>
  );
};
