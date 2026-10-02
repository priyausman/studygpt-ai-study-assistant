import React, { useState } from 'react';
import { X, Sparkles, BookOpen, Trash2, CheckCircle2 } from 'lucide-react';
import { UserPreferences, DifficultyLevel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (pref: UserPreferences) => void;
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  onClearHistory,
}) => {
  const [level, setLevel] = useState<UserPreferences['studyLevel']>(preferences.studyLevel);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(preferences.defaultDifficulty);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePreferences({
      studyLevel: level,
      defaultDifficulty: difficulty,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Study Settings</h3>
              <p className="text-xs text-slate-500">Customize your StudyGPT experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Academic Level */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Academic Stage
            </label>
            <p className="text-xs text-slate-500 mb-2.5">
              Adjusts the depth and vocabulary of AI explanations and quiz questions.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(['High School', 'Undergraduate', 'Graduate'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setLevel(lvl)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                    level === lvl
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Default Difficulty */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Default Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model Info */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center justify-between">
              <span>AI Engine</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-slate-500">
              High-speed reasoning, step-by-step academic explanations, and structured quiz generation.
            </p>
          </div>

          {/* Clear history */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <span className="block font-medium text-slate-800 text-xs">Reset Local History</span>
                <span className="text-[11px] text-slate-400">Clear all recent chats, summaries & quizzes</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset all saved study history to defaults?')) {
                    onClearHistory();
                    onClose();
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50/80 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {savedNotice ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                Saved!
              </>
            ) : (
              'Save Preferences'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
