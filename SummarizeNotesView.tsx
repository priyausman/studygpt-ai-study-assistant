import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  CheckCircle2,
  Bookmark,
  Loader2,
  AlertCircle,
  HelpCircle,
  Trash2,
  FileUp,
} from 'lucide-react';
import { SummaryResult } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface SummarizeNotesViewProps {
  onStartQuizWithTopic: (topic: string) => void;
  onActivityLogged: (item: { title: string; subtitle: string; targetTab: 'summarize' }) => void;
}

export const SummarizeNotesView: React.FC<SummarizeNotesViewProps> = ({
  onStartQuizWithTopic,
  onActivityLogged,
}) => {
  const [notes, setNotes] = useState('');
  const [style, setStyle] = useState('comprehensive');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleNotes = `LECTURE 14: OPERATING SYSTEMS - DEADLOCKS & MUTEX
Prof. Martinez | CS 301 Systems Programming

A deadlock is a situation wherein a set of concurrent processes are blocked because each process is holding a resource and waiting for another resource held by some other process in the same set.

Four Coffman Conditions necessary and sufficient for deadlock:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode (only one process can use it at a time).
2. Hold and Wait: A process must be holding at least one resource and requesting additional resources that are currently being held by other processes.
3. No Preemption: Resources cannot be forcibly preempted from a process; they can only be released voluntarily after the process finishes its task.
4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource needed by the next process in the chain (P0 waits for P1, P1 waits for P2... Pn waits for P0).

Deadlock Handling Strategies:
- Prevention: Invalidate at least one of the 4 Coffman conditions (e.g., impose strict global resource ordering to eliminate Circular Wait).
- Avoidance: Ensure the system never enters an unsafe state (e.g., Dijkstra's Banker's Algorithm with known maximum claims).
- Detection and Recovery: Allow deadlocks to occur, run periodic cycle-detection algorithms on the Resource Allocation Graph (RAG), and recover via process termination or resource rollback.
- Ostrich Algorithm: Ignore the problem if deadlocks occur very rarely (utilized in Unix/Windows due to lower overhead).`;

  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;

  const handleSummarize = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!notes.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: notes.trim(),
          style,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const firstLine = notes.trim().split('\n')[0].replace(/^[#*\s-]+/, '').slice(0, 32);
      const title = firstLine || 'Lecture Notes Summary';

      const completeResult: SummaryResult = {
        id: 'sum-' + Date.now(),
        title,
        shortSummary: data.shortSummary,
        keyPoints: data.keyPoints || [],
        importantTerms: data.importantTerms || [],
        originalNotes: notes.trim(),
        timestamp: new Date().toISOString(),
      };

      setResult(completeResult);
      onActivityLogged({
        title: `Summary: ${title}`,
        subtitle: `${completeResult.keyPoints.length} key points & ${completeResult.importantTerms.length} terms extracted`,
        targetTab: 'summarize',
      });
    } catch (err: any) {
      console.error('Failed to summarize notes:', err);
      setError(err?.message || 'Failed to summarize notes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    const textToCopy = `SUMMARY OF NOTES
${result.title}

SHORT SUMMARY:
${result.shortSummary}

KEY POINTS:
${result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

IMPORTANT TERMS:
${result.importantTerms.map((t) => `• ${t.term}: ${t.definition}`).join('\n')}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5 text-indigo-600 mb-1.5">
          <FileText className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Note Synthesizer</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Summarize Notes
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Paste <strong>ANY study material</strong>, lecture notes, research excerpts, or textbook readings from any discipline to extract essential insights and terms.
        </p>
      </div>

      {/* Input Notes Area */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <label htmlFor="notes-textarea" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Paste Notes or Readings (Any Academic Subject)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setNotes(sampleNotes)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/70 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>Load Sample Notes</span>
            </button>
            {notes && (
              <button
                type="button"
                onClick={() => setNotes('')}
                className="text-xs text-slate-400 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                title="Clear input"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <textarea
          id="notes-textarea"
          rows={9}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste ANY study material or notes here (e.g. computer science, biology, chemistry, mathematics, economics, history, physics, literature)..."
          className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-mono leading-relaxed"
        />

        {/* Counter and Submit */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{notes.length} characters</span>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="comprehensive">Comprehensive Study Guide</option>
              <option value="concise">Concise High-Yield Points</option>
              <option value="exam-prep">Exam Focused Review</option>
            </select>

            <button
              type="button"
              onClick={() => handleSummarize()}
              disabled={!notes.trim() || isLoading}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all ${
                notes.trim() && !isLoading
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-98'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Summarize</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result Cards */}
      {result && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{result.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Synthesized by StudyGPT • {result.keyPoints.length} core takeaways
              </p>
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
                    <span>Copy Summary</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onStartQuizWithTopic(result.title)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 text-xs font-semibold transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Quiz Me on This</span>
              </button>
            </div>
          </div>

          {/* 1. Short Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <Bookmark className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Short Summary</h3>
            </div>
            <div className="text-slate-700 text-sm sm:text-base leading-relaxed">
              <MarkdownRenderer content={result.shortSummary} />
            </div>
          </div>

          {/* 2. Key Points */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center gap-2 text-indigo-600 mb-3.5">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900">Key Points</h3>
            </div>
            <div className="space-y-2.5">
              {result.keyPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-200/60"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-sm text-slate-700 leading-relaxed font-medium">
                    <MarkdownRenderer content={point} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Important Terms */}
          {result.importantTerms && result.importantTerms.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
              <div className="flex items-center gap-2 text-indigo-600 mb-3.5">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-900">Important Terms</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.importantTerms.map((termItem, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-indigo-50/30 border border-indigo-100/80 hover:bg-indigo-50/60 transition-colors"
                  >
                    <span className="font-bold text-sm text-indigo-900 block mb-1">
                      {termItem.term}
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {termItem.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-center text-slate-400 pt-2">
        StudyGPT can make mistakes. Verify important information with your course materials.
      </p>
    </div>
  );
};
