import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  HelpCircle,
  GraduationCap,
  Layers,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  Square,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, ChatSession, TabType } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatViewProps {
  currentChat: ChatSession;
  onUpdateChat: (updated: ChatSession) => void;
  onNewChat: () => void;
  onNavigateToTool?: (toolTab: TabType) => void;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

// Cleans markdown syntax so speech synthesis sounds natural and conversational
function stripMarkdownForSpeech(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$[\s\S]*?\$\$/g, 'Formula omitted.')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/^>\s+/gm, '')
    .replace(/^-{3,}$/gm, '')
    .replace(/^[\*\-\+]\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .trim();
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentChat,
  onUpdateChat,
  onNewChat,
  onNavigateToTool,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Voice input states & refs
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const hasLiveTranscriptRef = useRef(false);

  // AI Voice Response (Text-to-Speech) states
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInsideIframe = typeof window !== 'undefined' && window.self !== window.top;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat.messages, isLoading, isTranscribing]);

  // Handle incoming initial prompt if forwarded
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSendPrompt(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  // Clean up media streams, speech recognition, and speech synthesis on unmount or chat switch
  useEffect(() => {
    return () => {
      stopListening();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentChat.id]);

  // ---------------- Robust Voice Input (getUserMedia + MediaRecorder + WebSpeech fallback) ----------------
  const startListening = async () => {
    setSpeechError(null);
    hasLiveTranscriptRef.current = false;
    audioChunksRef.current = [];

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setSpeechError(
        'Audio recording is not supported in this browser. Please use Chrome, Edge, or Safari.'
      );
      return;
    }

    let stream: MediaStream;
    try {
      // Explicitly request user microphone access
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
    } catch (err: any) {
      console.warn('Microphone getUserMedia error:', err);
      setIsListening(false);

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setSpeechError(
          'Microphone access was denied. If previewing inside Google AI Studio, please allow microphone access for this site or click "Open in new window" below.'
        );
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setSpeechError('No microphone hardware was detected on your device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setSpeechError('Your microphone is currently in use by another application or browser tab.');
      } else {
        setSpeechError(`Could not access microphone: ${err.message || err.name}`);
      }
      return;
    }

    setIsListening(true);

    // 1. Initialize MediaRecorder on the active stream
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop audio tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }

        // If SpeechRecognition already gave us live text, skip secondary AI transcription
        if (hasLiveTranscriptRef.current) {
          setIsTranscribing(false);
          return;
        }

        // If Web Speech was blocked or provided no text, transcribe audio chunks via Gemini
        const chunks = audioChunksRef.current;
        if (chunks.length === 0) {
          setIsTranscribing(false);
          return;
        }

        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 600) {
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              if (!base64Data) {
                setIsTranscribing(false);
                return;
              }

              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audio: base64Data,
                  mimeType: audioBlob.type || 'audio/webm',
                }),
              });

              if (res.ok) {
                const data = await res.json();
                if (data.text && data.text.trim()) {
                  setInput((prev) => {
                    const cleanPrev = prev.trim();
                    const newText = data.text.trim();
                    return cleanPrev ? `${cleanPrev} ${newText}` : newText;
                  });
                }
              }
            } catch (transcribeErr) {
              console.warn('Transcribe error:', transcribeErr);
            } finally {
              setIsTranscribing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          console.warn('FileReader error:', e);
          setIsTranscribing(false);
        }
      };

      recorder.start(250);
    } catch (recorderErr) {
      console.warn('MediaRecorder init error:', recorderErr);
    }

    // 2. Concurrently attempt Web Speech API for instantaneous live text streaming
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        const initialInput = input;

        recognition.onresult = (event: any) => {
          let liveTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            liveTranscript += event.results[i][0].transcript;
          }

          if (liveTranscript.trim()) {
            hasLiveTranscriptRef.current = true;
            if (initialInput.trim()) {
              setInput(`${initialInput.trim()} ${liveTranscript.trimStart()}`);
            } else {
              setInput(liveTranscript);
            }
          }
        };

        recognition.onerror = (event: any) => {
          // In some cross-origin iframe security environments, Web Speech API fires not-allowed.
          // Because MediaRecorder is actively recording on the granted MediaStream, we log and rely on Gemini transcribe.
          console.log('Web Speech notice:', event.error);
        };

        recognition.onend = () => {
          // Stream ended
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (speechErr) {
        console.log('Web Speech API unavailable in this context, using MediaRecorder fallback');
      }
    }
  };

  const stopListening = () => {
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    } else if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // ---------------- Text-to-Speech (AI Voice Response) ----------------
  const handleToggleSpeak = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setErrorMessage('Text-to-speech is not supported in this browser.');
      return;
    }

    // If currently speaking this exact message, stop it
    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    // Stop any previously playing speech
    window.speechSynthesis.cancel();

    const textToSpeak = stripMarkdownForSpeech(text);
    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick a natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeakingMessageId(null);
    };

    speechUtteranceRef.current = utterance;
    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendPrompt = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // If microphone is still listening, stop it
    if (isListening) {
      stopListening();
    }

    setErrorMessage(null);
    setSpeechError(null);

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...currentChat.messages, userMsg];
    let chatTitle = currentChat.title;
    if (currentChat.messages.length === 0 || currentChat.title === 'New Conversation') {
      chatTitle = textToSend.trim().slice(0, 35) + (textToSend.length > 35 ? '...' : '');
    }

    const updatedSession: ChatSession = {
      ...currentChat,
      title: chatTitle,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
    };

    onUpdateChat(updatedSession);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        content: data.text || 'Unable to retrieve answer.',
        timestamp: new Date().toISOString(),
      };

      onUpdateChat({
        ...updatedSession,
        messages: [...updatedMessages, aiMsg],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Chat request failed:', err);
      setErrorMessage(err?.message || 'Failed to connect to StudyGPT service.');
      const fallbackAiMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        content: `I encountered an issue generating a response: "${err?.message || 'Network error'}".\n\nPlease ensure your GEMINI_API_KEY is configured in your project secrets, or try asking your question again!`,
        timestamp: new Date().toISOString(),
      };
      onUpdateChat({
        ...updatedSession,
        messages: [...updatedMessages, fallbackAiMsg],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendPrompt(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // User requested example prompts showcasing universal multi-subject support
  const universalSamplePrompts = [
    { text: 'Explain AI agents.', category: 'Artificial Intelligence' },
    { text: 'Explain photosynthesis.', category: 'Biology' },
    { text: "Explain Bayes' theorem.", category: 'Mathematics' },
    { text: 'Explain polymorphism in Java.', category: 'Programming' },
    { text: 'What is phishing?', category: 'Cybersecurity' },
    { text: 'What is TCP vs UDP?', category: 'Computer Networks' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen max-w-4xl mx-auto px-3 sm:px-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between py-3.5 border-b border-slate-200/80 bg-[#F8FAFC]/90 backdrop-blur-xs sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                {currentChat.title || 'General Study Assistant'}
              </h2>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Any Academic Subject
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Voice & Text enabled • Switch subjects freely</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Optional Companion Tools quick-access dropdown or pill */}
          {onNavigateToTool && (
            <div className="hidden md:flex items-center gap-1.5 pr-2 mr-2 border-r border-slate-200">
              <span className="text-[11px] font-medium text-slate-400">Optional Tools:</span>
              <button
                type="button"
                onClick={() => onNavigateToTool('explain')}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Structured Explain Tool"
              >
                Explain
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTool('summarize')}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Summarize Notes Tool"
              >
                Summarize
              </button>
              <button
                type="button"
                onClick={() => onNavigateToTool('quiz')}
                className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Generate MCQs Tool"
              >
                Quiz
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto py-5 space-y-6">
        {currentChat.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[380px] text-center p-4 sm:p-6 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              <GraduationCap className="w-7 h-7" />
            </div>

            <div className="max-w-lg space-y-2">
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Ask StudyGPT Anything
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Your general-purpose university study assistant. Ask about <strong>any academic subject</strong> by <strong>typing or speaking</strong>. You can switch subjects freely in the same chat!
              </p>
            </div>

            {/* General Subject Examples */}
            <div className="w-full max-w-xl space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                <span>Try an example question:</span>
                <span className="text-[11px] text-indigo-600 font-medium normal-case">Click to ask instantly</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {universalSamplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendPrompt(p.text)}
                    className="p-3 rounded-xl bg-white hover:bg-indigo-50/60 border border-slate-200/90 hover:border-indigo-300 transition-all shadow-2xs group cursor-pointer flex flex-col justify-between text-left"
                  >
                    <span className="text-xs font-semibold text-slate-800 group-hover:text-indigo-700 leading-snug">
                      "{p.text}"
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-500 mt-2 uppercase tracking-wide">
                      {p.category}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Note highlighting freedom of subjects & voice */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900 max-w-md">
              💡 <strong>Voice Tip:</strong> Click the microphone 🎙️ below to speak your question aloud, or click <strong>Listen</strong> on any AI response to hear it spoken back to you!
            </div>
          </div>
        ) : (
          currentChat.messages.map((msg) => {
            const isUser = msg.role === 'user';
            const isSpeakingThisMsg = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      <MarkdownRenderer content={msg.content} />
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-500">StudyGPT AI</span>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                          {/* AI Voice Read Aloud / Stop Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleSpeak(msg.id, msg.content)}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isSpeakingThisMsg
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-1 ring-indigo-200'
                                : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                            }`}
                            title={isSpeakingThisMsg ? 'Stop listening' : 'Listen to this explanation'}
                          >
                            {isSpeakingThisMsg ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-current text-indigo-600" />
                                <span className="text-[11px] text-indigo-700">Stop</span>
                                <span className="flex h-1.5 w-1.5 relative ml-0.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-600"></span>
                                </span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Listen</span>
                              </>
                            )}
                          </button>

                          {/* Copy response */}
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500 text-[11px]">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[11px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl rounded-bl-xs p-4 shadow-xs flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="text-xs text-slate-500 font-medium">
                StudyGPT is generating an explanation...
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="py-3 bg-[#F8FAFC]">
        {/* Quick subject shortcuts pill bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px] text-slate-500 no-scrollbar">
          <span className="text-slate-400 shrink-0 font-medium">Quick ask:</span>
          {[
            'Explain AI agents.',
            'Explain photosynthesis.',
            "Explain Bayes' theorem.",
            'Explain polymorphism in Java.',
            'What is phishing?',
          ].map((promptSnippet, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendPrompt(promptSnippet)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 transition-colors cursor-pointer"
            >
              {promptSnippet}
            </button>
          ))}
        </div>

        {/* Active Speech Recognition Visual Banner */}
        {isListening && (
          <div className="mb-2 px-3.5 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between shadow-2xs text-xs text-indigo-950 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="font-bold text-indigo-900">Listening to your microphone...</span>
              <span className="text-slate-500 hidden sm:inline">
                Speak your question clearly. Click Done when finished.
              </span>
            </div>
            <button
              type="button"
              onClick={stopListening}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Square className="w-3 h-3 fill-current text-rose-600" />
              <span>Done Speaking</span>
            </button>
          </div>
        )}

        {/* AI Audio Transcription in progress Banner */}
        {isTranscribing && (
          <div className="mb-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-xs text-indigo-800 shadow-2xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
            <span className="font-semibold">Transcribing speech with Gemini AI...</span>
            <span className="text-slate-500 text-[11px] hidden sm:inline">Placing text in box below</span>
          </div>
        )}

        {/* Microphone Error Notice */}
        {speechError && (
          <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span>{speechError}</span>
                {isInsideIframe && (
                  <div className="pt-0.5">
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open StudyGPT in a new tab (bypasses iframe restrictions)</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-amber-600 hover:text-amber-800 p-1 font-bold text-sm cursor-pointer shrink-0"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`relative bg-white rounded-2xl border shadow-sm transition-all ${
            isListening
              ? 'border-indigo-500 ring-2 ring-indigo-200'
              : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'
          }`}
        >
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Listening to speech... your words will appear here'
                : isTranscribing
                ? 'Transcribing audio...'
                : 'Ask by typing or clicking the microphone 🎙️ (e.g. AI agents, photosynthesis, Bayes theorem)...'
            }
            className="w-full resize-none p-3.5 pr-28 rounded-2xl outline-none text-sm text-slate-800 placeholder-slate-400 font-normal"
          />

          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
            {/* Microphone Voice Input Button */}
            <button
              type="button"
              onClick={handleToggleListening}
              disabled={isLoading || isTranscribing}
              className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 animate-pulse'
                  : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'
              }`}
              title={isListening ? 'Stop listening (Click to finish)' : 'Voice input: Click to speak your question'}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4 text-white" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isTranscribing}
              className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                input.trim() && !isLoading && !isTranscribing
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Academic disclaimer */}
        <p className="text-[11px] text-center text-slate-400 mt-2">
          StudyGPT can make mistakes. Verify important information with your course materials.
        </p>
      </div>
    </div>
  );
};
