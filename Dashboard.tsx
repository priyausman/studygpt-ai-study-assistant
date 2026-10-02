import React from 'react';
import {
  MessageSquare,
  BookOpen,
  FileText,
  HelpCircle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { TabType, RecentActivityItem } from '../types';

interface DashboardProps {
  onSelectTab: (tab: TabType) => void;
  recentActivities: RecentActivityItem[];
  onSelectActivity: (activity: RecentActivityItem) => void;
  onQuickPrompt: (prompt: string, tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTab,
  recentActivities,
  onSelectActivity,
  onQuickPrompt,
}) => {
  const featureCards = [
    {
      tab: 'chat' as TabType,
      title: 'Ask StudyGPT',
      icon: <MessageSquare className="w-6 h-6 text-indigo-600" />,
      badge: 'Interactive AI Chat',
      description:
        'Engage in real-time academic discussion. Ask homework questions, clarify theorems, or brainstorm paper outlines.',
      samplePrompt: "Explain Bayes' theorem in simple words.",
      actionLabel: 'Open Chat',
      gradient: 'from-indigo-50 to-indigo-100/40',
    },
    {
      tab: 'explain' as TabType,
      title: 'Explain a Topic',
      icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
      badge: 'Tiered Difficulty',
      description:
        'Get clear, structured explanations broken into core concepts, intuitive real-world examples, and concise summaries.',
      samplePrompt: 'Explain Heapsort Algorithm',
      actionLabel: 'Explain Topic',
      gradient: 'from-blue-50 to-indigo-50/40',
    },
    {
      tab: 'summarize' as TabType,
      title: 'Summarize Notes',
      icon: <FileText className="w-6 h-6 text-indigo-600" />,
      badge: 'Lecture Synthesizer',
      description:
        'Paste raw lecture slides or long textbook readings. Receive high-yield takeaways and a glossary of key academic terms.',
      samplePrompt: 'Summarize Operating Systems Concurrency',
      actionLabel: 'Paste Notes',
      gradient: 'from-slate-50 to-indigo-50/30',
    },
    {
      tab: 'quiz' as TabType,
      title: 'Generate MCQs',
      icon: <HelpCircle className="w-6 h-6 text-indigo-600" />,
      badge: 'Exam Practice',
      description:
        'Generate custom multiple-choice quizzes with 4 choices, instant automated scoring, and detailed pedagogical feedback.',
      samplePrompt: 'Quiz on Data Structures',
      actionLabel: 'Start Practice Quiz',
      gradient: 'from-violet-50 to-indigo-50/40',
    },
  ];

  const quickPicks = [
    { label: "Explain Bayes' Theorem", tab: 'explain' as TabType, prompt: "Bayes' Theorem" },
    { label: "Dijkstra's Shortest Path", tab: 'explain' as TabType, prompt: "Dijkstra's Algorithm" },
    { label: "Summarize Deadlocks & Mutex", tab: 'summarize' as TabType, prompt: "Deadlocks & Mutex" },
    { label: "Quiz: Data Structures", tab: 'quiz' as TabType, prompt: "Data Structures" },
    { label: "Quiz: Cybersecurity Fundamentals", tab: 'quiz' as TabType, prompt: "Cybersecurity" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-10">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-10">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>University Edition • Powered by Gemini 3.8 Flash</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
            StudyGPT
          </h1>

          <p className="text-lg sm:text-xl font-medium text-slate-600">
            Your AI-powered study companion
          </p>

          <p className="text-sm sm:text-base text-slate-500 leading-relaxed pt-1">
            Master demanding coursework faster. Break down dense theories, synthesize lengthy lecture transcripts, test your recall with customized MCQs, and receive instant explanations.
          </p>

          {/* Quick study prompts bar */}
          <div className="pt-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Popular Study Topics:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPicks.map((pick, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onQuickPrompt(pick.prompt, pick.tab)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-700 transition-all cursor-pointer"
                >
                  <span>{pick.label}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Feature Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Study Tools</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              4 modules
            </span>
          </h2>
          <span className="text-xs text-slate-400">Select any tool to begin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {featureCards.map((card) => (
            <div
              key={card.tab}
              onClick={() => onSelectTab(card.tab)}
              className="group relative bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-indigo-300 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3.5">
                  <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 group-hover:scale-105 transition-transform duration-200">
                    {card.icon}
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h3>

                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1 group-hover:gap-1.5 transition-all">
                  <span>{card.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                  e.g., {card.samplePrompt}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <span className="text-xs text-slate-400">
            {recentActivities.length} items logged
          </span>
        </div>

        {recentActivities.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No recent activity yet. Pick any tool above to start studying!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act)}
                className="py-3 px-2 sm:px-3 -mx-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    {act.type === 'chat' && <MessageSquare className="w-4 h-4" />}
                    {act.type === 'explain' && <BookOpen className="w-4 h-4" />}
                    {act.type === 'summarize' && <FileText className="w-4 h-4" />}
                    {act.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{act.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-400 hidden sm:inline-block">
                    {act.timestamp}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Academic Disclaimer Note */}
      <div className="text-center py-2">
        <p className="text-xs text-slate-400">
          StudyGPT can make mistakes. Verify important information with your course materials.
        </p>
      </div>
    </div>
  );
};
