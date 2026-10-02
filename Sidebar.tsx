import React from 'react';
import {
  MessageSquare,
  BookOpen,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Settings,
  X,
  GraduationCap,
  Sparkles,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';
import { TabType, ChatSession } from '../types';

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onNewChat: () => void;
  chats: ChatSession[];
  currentChatId: string;
  onSelectChat: (chatId: string) => void;
  onOpenSettings: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onNewChat,
  chats,
  currentChatId,
  onSelectChat,
  onOpenSettings,
  isMobileOpen,
  onCloseMobile,
}) => {
  const navItems: { tab: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      tab: 'chat',
      label: 'Ask StudyGPT',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: 'Central AI',
    },
    {
      tab: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      tab: 'explain',
      label: 'Explain a Topic',
      icon: <BookOpen className="w-4 h-4" />,
      badge: 'Tool',
    },
    {
      tab: 'summarize',
      label: 'Summarize Notes',
      icon: <FileText className="w-4 h-4" />,
      badge: 'Tool',
    },
    {
      tab: 'quiz',
      label: 'Generate MCQs',
      icon: <HelpCircle className="w-4 h-4" />,
      badge: 'Tool',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
          <div
            onClick={() => {
              onSelectTab('dashboard');
              onCloseMobile();
            }}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-800">StudyGPT</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">University Companion</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button: + New Chat */}
        <div className="p-4 pb-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
          {/* Main Features */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Features
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.tab);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Recent Chats Section */}
          <div>
            <div className="flex items-center justify-between px-3 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Recent Chats
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{chats.length}</span>
            </div>
            <div className="space-y-0.5">
              {chats.map((chat) => {
                const isSelected = activeTab === 'chat' && currentChatId === chat.id;
                return (
                  <button
                    key={chat.id}
                    type="button"
                    onClick={() => {
                      onSelectChat(chat.id);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg transition-colors text-left truncate cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    title={chat.title}
                  >
                    <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{chat.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer with Settings and Engine status */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <button
            type="button"
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200/80 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>Settings</span>
          </button>

          <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Gemini 3.8 Flash</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </aside>
    </>
  );
};
