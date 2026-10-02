import React, { useState, useEffect } from 'react';
import {
  Menu,
  GraduationCap,
  Plus,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  TabType,
  ChatSession,
  RecentActivityItem,
  UserPreferences,
  DifficultyLevel,
} from './types';
import {
  getStoredChats,
  saveStoredChats,
  getCurrentChatId,
  setCurrentChatId,
  getStoredActivities,
  addRecentActivity,
  getStoredPreferences,
  saveStoredPreferences,
  DEFAULT_PREFERENCES,
} from './utils/storage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ChatView } from './components/ChatView';
import { ExplainTopicView } from './components/ExplainTopicView';
import { SummarizeNotesView } from './components/SummarizeNotesView';
import { QuizView } from './components/QuizView';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatIdState] = useState<string>('');
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Cross-component handoff states
  const [quizInitialTopic, setQuizInitialTopic] = useState<string | undefined>();
  const [quizInitialDifficulty, setQuizInitialDifficulty] = useState<DifficultyLevel | undefined>();
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>();

  // Initialize from storage on mount
  useEffect(() => {
    const loadedChats = getStoredChats();
    setChats(loadedChats);
    const initialId = getCurrentChatId();
    setCurrentChatIdState(initialId);
    setRecentActivities(getStoredActivities());
    setPreferences(getStoredPreferences());
  }, []);

  const currentChat =
    chats.find((c) => c.id === currentChatId) ||
    chats[0] || {
      id: 'chat-new',
      title: 'New Conversation',
      messages: [],
      updatedAt: new Date().toISOString(),
    };

  const handleUpdateChat = (updatedChat: ChatSession) => {
    const exists = chats.some((c) => c.id === updatedChat.id);
    let newChats: ChatSession[];
    if (exists) {
      newChats = chats.map((c) => (c.id === updatedChat.id ? updatedChat : c));
    } else {
      newChats = [updatedChat, ...chats];
    }
    setChats(newChats);
    saveStoredChats(newChats);

    // If chat title or message was updated, log to activity
    if (updatedChat.messages.length > 0) {
      const lastMsg = updatedChat.messages[updatedChat.messages.length - 1];
      if (lastMsg.role === 'user') {
        const preview = lastMsg.content.slice(0, 45) + (lastMsg.content.length > 45 ? '...' : '');
        addRecentActivity({
          type: 'chat',
          title: updatedChat.title,
          subtitle: preview,
          targetTab: 'chat',
          metadata: { chatId: updatedChat.id },
        });
        setRecentActivities(getStoredActivities());
      }
    }
  };

  const handleNewChat = () => {
    const newId = 'chat-' + Date.now();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Conversation',
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    const updatedChats = [newSession, ...chats];
    setChats(updatedChats);
    saveStoredChats(updatedChats);
    setCurrentChatIdState(newId);
    setCurrentChatId(newId);
    setActiveTab('chat');
  };

  const handleSelectChat = (chatId: string) => {
    setCurrentChatIdState(chatId);
    setCurrentChatId(chatId);
    setActiveTab('chat');
  };

  const handleActivityLogged = (item: {
    title: string;
    subtitle: string;
    targetTab: 'explain' | 'summarize' | 'quiz';
  }) => {
    addRecentActivity({
      type: item.targetTab,
      title: item.title,
      subtitle: item.subtitle,
      targetTab: item.targetTab,
    });
    setRecentActivities(getStoredActivities());
  };

  const handleSelectActivity = (activity: RecentActivityItem) => {
    if (activity.type === 'chat') {
      if (activity.metadata?.chatId) {
        handleSelectChat(activity.metadata.chatId);
      } else {
        setActiveTab('chat');
      }
    } else if (activity.type === 'explain') {
      setActiveTab('explain');
    } else if (activity.type === 'summarize') {
      setActiveTab('summarize');
    } else if (activity.type === 'quiz') {
      setActiveTab('quiz');
    }
  };

  const handleQuickPrompt = (prompt: string, tab: TabType) => {
    if (tab === 'chat') {
      handleNewChat();
      setChatInitialPrompt(prompt);
      setActiveTab('chat');
    } else if (tab === 'explain') {
      setActiveTab('explain');
    } else if (tab === 'summarize') {
      setActiveTab('summarize');
    } else if (tab === 'quiz') {
      setQuizInitialTopic(prompt);
      setActiveTab('quiz');
    }
  };

  const handleStartQuizWithTopic = (topic: string, diff?: DifficultyLevel) => {
    setQuizInitialTopic(topic);
    if (diff) setQuizInitialDifficulty(diff);
    setActiveTab('quiz');
  };

  const handleAskInChat = (prompt: string) => {
    handleNewChat();
    setChatInitialPrompt(prompt);
    setActiveTab('chat');
  };

  const handleSavePreferences = (pref: UserPreferences) => {
    setPreferences(pref);
    saveStoredPreferences(pref);
  };

  const handleClearHistory = () => {
    localStorage.clear();
    const defaultList = getStoredChats();
    setChats(defaultList);
    setCurrentChatIdState(defaultList[0]?.id || 'chat-bayes-theorem');
    setRecentActivities(getStoredActivities());
    setPreferences(DEFAULT_PREFERENCES);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewChat={handleNewChat}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Top Navbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white border-b border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-800">
                StudyGPT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="flex items-center gap-1 py-1.5 px-3 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1">
          {activeTab === 'dashboard' && (
            <Dashboard
              onSelectTab={setActiveTab}
              recentActivities={recentActivities}
              onSelectActivity={handleSelectActivity}
              onQuickPrompt={handleQuickPrompt}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView
              currentChat={currentChat}
              onUpdateChat={handleUpdateChat}
              onNewChat={handleNewChat}
              onNavigateToTool={(tool) => setActiveTab(tool)}
              initialPrompt={chatInitialPrompt}
              onClearInitialPrompt={() => setChatInitialPrompt(undefined)}
            />
          )}

          {activeTab === 'explain' && (
            <ExplainTopicView
              onStartQuizWithTopic={handleStartQuizWithTopic}
              onAskInChat={handleAskInChat}
              onActivityLogged={handleActivityLogged}
              defaultDifficulty={preferences.defaultDifficulty}
            />
          )}

          {activeTab === 'summarize' && (
            <SummarizeNotesView
              onStartQuizWithTopic={handleStartQuizWithTopic}
              onActivityLogged={handleActivityLogged}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizView
              initialTopic={quizInitialTopic}
              initialDifficulty={quizInitialDifficulty}
              onActivityLogged={handleActivityLogged}
              onAskInChat={handleAskInChat}
              defaultDifficulty={preferences.defaultDifficulty}
            />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
