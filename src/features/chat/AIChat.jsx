import { useState, useRef, useEffect } from 'react';
import { Leaf, User, PaperPlaneRight, CircleNotch, GearSix, Eye, EyeSlash, Key, Trash, X, Info, Plus, List, CaretDoubleLeft, ChatTeardropText, PencilSimple, Check } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { 
  sendQuickChat, 
  analyzeLahan, 
  fetchChatHistory, 
  saveChatMessage,
  fetchChatSessions,
  updateSessionTitle
} from '../../services/aiChatService';
import { getAllLahan } from '../../services/lahanService';

// Custom Markdown Renderer (Strict White Theme)
const markdownComponents = {
  h1: ({ children }) => <h1 className="text-xl font-black mt-4 mb-2 text-gray-900">{children}</h1>,
  h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2 text-gray-900">{children}</h2>,
  h3: ({ children }) => <h3 className="text-base font-bold mt-3 mb-1 text-gray-900">{children}</h3>,
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-gray-800">{children}</p>,
  strong: ({ children }) => <strong className="font-extrabold text-gray-900">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-600">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1 text-gray-800">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-gray-800">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="bg-gray-100 text-primary px-1.5 py-0.5 rounded text-[13px] font-mono font-bold border border-gray-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-gray-50 p-4 rounded-xl overflow-x-auto border border-gray-200 mb-3 text-[13px] font-mono text-gray-800">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-gray-50 border-b border-gray-200">{children}</thead>,
  th: ({ children }) => <th className="px-4 py-3 font-bold text-gray-900 truncate">{children}</th>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-gray-50/50 hover:bg-opacity-50 transition-colors">{children}</tr>,
  td: ({ children }) => <td className="px-4 py-3 text-gray-800">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-4 my-3 text-gray-600 italic bg-gray-50/50 py-2 rounded-r-lg">
      {children}
    </blockquote>
  ),
};

// Greeting message shown when there's no history
const GREETING_MESSAGE = {
  role: 'assistant',
  content: 'Halo! Saya adalah **Pakar AI Agronomi Orbitani**. Ada masalah spesifik pada lahan atau tanaman Anda yang bisa saya analisis hari ini?'
};

// Helper: Format Time Ago natively
const timeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return `Baru saja`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // Session & Sidebar States
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Responsive
  
  // Rename States
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState('');

  // Lahan States
  const [lahanOptions, setLahanOptions] = useState([]);
  const [selectedLahan, setSelectedLahan] = useState('');

  // BYOK Modal State
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const hasStoredKey = !!localStorage.getItem('custom_gemini_key');
  const [keyStored, setKeyStored] = useState(hasStoredKey);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchLahanOptions();
    loadSessions();
  }, []);

  // When current session changes, load its history
  useEffect(() => {
    loadChatHistory(currentSessionId);
  }, [currentSessionId]);

  useEffect(() => {
    // Smooth scroll to bottom every time messages update or loading state changes
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // ──── Data Fetchers ────
  const fetchLahanOptions = async () => {
    try {
      const data = await getAllLahan();
      setLahanOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed fetching lahan:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await fetchChatSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed fetching sessions:', err);
    }
  };

  const loadChatHistory = async (sessionId) => {
    if (!sessionId) {
      // New chat state
      setMessages([GREETING_MESSAGE]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const history = await fetchChatHistory(sessionId);
      if (Array.isArray(history) && history.length > 0) {
        // Map backend roles: "ai" → "assistant" for frontend rendering
        const mapped = history.map((msg) => ({
          role: msg.role === 'ai' ? 'assistant' : msg.role,
          content: msg.content,
        }));
        setMessages(mapped);
      } else {
        setMessages([GREETING_MESSAGE]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      setMessages([GREETING_MESSAGE]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // ──── Action Handlers ────
  const handleNewChat = () => {
    setCurrentSessionId(null);
    if (window.innerWidth < 1024) setIsSidebarOpen(false); // close sidebar on mobile
  };

  const handleSelectSession = (id) => {
    if (id === currentSessionId) return;
    setCurrentSessionId(id);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  // ──── Rename Flow ────
  const handleStartRename = (e, session) => {
    e.stopPropagation();
    setEditingSessionId(session.session_id);
    setEditTitleInput(session.session_title);
  };

  const handleSaveRename = async (e) => {
    e.stopPropagation();
    if (!editTitleInput.trim() || !editingSessionId) {
      setEditingSessionId(null);
      return;
    }
    
    // Optimistic UI update in sidebar
    setSessions(prev => 
      prev.map(s => s.session_id === editingSessionId ? { ...s, session_title: editTitleInput.trim() } : s)
    );
    
    try {
      await updateSessionTitle(editingSessionId, editTitleInput.trim());
      // Refresh strictly from backend in background to keep date exact
      loadSessions();
    } catch (err) {
      toast.error('Gagal mengganti nama sesi');
      loadSessions(); // Rollback on failure
    } finally {
      setEditingSessionId(null);
    }
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  // ──── Chat Sending Logic ────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Auto-Title Fallback Logic for New Sessions
    let activeSessionId = currentSessionId;
    let newSessionTitle = null;
    
    if (!activeSessionId) {
      // 1. Generate new UUID
      activeSessionId = crypto.randomUUID();
      setCurrentSessionId(activeSessionId); // update local state

      // 2. Extract first 4 words or max 20 chars if gibberish (no spaces)
      const words = text.split(/\s+/);
      if (words.length > 0 && text.includes(' ')) {
        newSessionTitle = words.slice(0, 4).join(' ');
      } else {
        newSessionTitle = text.substring(0, 20); // 20 char fallback
      }
    }

    // Step A: Optimistic UI
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      // Step B: Persist user message to DB (contains UUID and Title on first send)
      saveChatMessage('user', text, activeSessionId, newSessionTitle)
        .then(() => {
          // If it was a new session, reload sidebar gently to show it
          if (newSessionTitle) loadSessions();
        })
        .catch((err) => console.warn('Failed to save user msg:', err));

      // Step C: Call Gemini AI
      let responseData;
      if (selectedLahan) {
        responseData = await analyzeLahan(text, selectedLahan);
      } else {
        responseData = await sendQuickChat(text);
      }

      const aiContent = responseData.answer || responseData.response || 'Maaf, respon tidak dapat diproses saat ini.';

      // Step D: Show AI response
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: aiContent }
      ]);

      // Step E: Persist AI response
      saveChatMessage('ai', aiContent, activeSessionId, null)
        .catch((err) => console.warn('Failed to save AI msg:', err));

    } catch (err) {
      console.error(err);
      // Let global interceptor handle toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // BYOK Handlers
  const handleOpenModal = () => {
    const stored = localStorage.getItem('custom_gemini_key') || '';
    setApiKeyInput(stored);
    setShowKey(false);
    setShowApiKeyModal(true);
  };

  const handleSaveKey = () => {
    const key = apiKeyInput.trim();
    if (!key) {
      toast.error('API Key tidak boleh kosong.');
      return;
    }
    localStorage.setItem('custom_gemini_key', key);
    setKeyStored(true);
    setShowApiKeyModal(false);
    toast.success('API Key berhasil disimpan! Request berikutnya akan menggunakan kunci Anda.', { duration: 4000 });
  };

  const handleDeleteKey = () => {
    localStorage.removeItem('custom_gemini_key');
    setApiKeyInput('');
    setKeyStored(false);
    setShowApiKeyModal(false);
    toast.success('API Key dihapus. Kembali menggunakan server default Orbitani.', { duration: 4000 });
  };

  // ──── Skeleton Loaders ────
  const HistorySkeleton = () => (
    <div className="flex-1 overflow-hidden px-4 md:px-8 py-6 space-y-6 bg-white">
      {[...Array(4)].map((_, idx) => (
        <div key={idx} className={`flex w-full ${idx % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`flex gap-3 max-w-[70%] ${idx % 2 !== 0 ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className={`h-4 bg-gray-100 rounded-lg animate-pulse ${idx % 2 === 0 ? 'w-3/4' : 'w-1/2'}`} />
              <div className={`h-4 bg-gray-50 rounded-lg animate-pulse ${idx % 2 === 0 ? 'w-1/2' : 'w-2/3'}`} />
              {idx % 2 === 0 && <div className="h-4 bg-gray-50 rounded-lg animate-pulse w-2/5" />}
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-center pt-4">
        <div className="flex items-center gap-2 text-gray-400">
          <CircleNotch size={18} className="animate-spin text-primary" weight="bold" />
          <span className="text-xs font-medium">Memuat riwayat obrolan...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex bg-white overflow-hidden relative">
      
      {/* ──── SIDEBAR ──── */}
      <div className={`
          absolute lg:static top-0 left-0 h-full w-[280px] bg-gray-50 border-r border-gray-200 z-40
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Sidebar Header & New Chat Button */}
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary-hover active:scale-95 transition-all text-center"
          >
            <Plus size={16} weight="bold" />
            Percakapan Baru
          </button>
          
          {/* Close Sidebar (Mobile only) */}
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-2 p-2.5 rounded-xl text-gray-500 hover:bg-gray-100">
            <CaretDoubleLeft size={20} />
          </button>
        </div>

        {/* Sidebar Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
          <p className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-1">Riwayat Analisis</p>
          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-gray-400">Belum ada sesi tersimpan.</div>
          ) : (
            <div className="space-y-1">
              {sessions.map(session => (
                <div 
                  key={session.session_id} 
                  onClick={() => handleSelectSession(session.session_id)}
                  className={`group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    currentSessionId === session.session_id 
                      ? 'bg-gray-200 text-gray-900 shadow-sm' 
                      : 'hover:bg-gray-100/80 text-gray-700'
                  }`}
                >
                  <ChatTeardropText size={18} className={`shrink-0 mt-0.5 ${currentSessionId === session.session_id ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} weight={currentSessionId === session.session_id ? 'fill' : 'regular'} />
                  
                  <div className="flex-1 min-w-0 pr-6">
                    {editingSessionId === session.session_id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          type="text"
                          value={editTitleInput}
                          onChange={(e) => setEditTitleInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(e)}
                          className="w-full text-sm font-semibold bg-white border border-primary-200 px-2 py-0.5 rounded text-gray-900 focus:outline-none"
                        />
                        <button onClick={handleSaveRename} className="p-1 text-primary hover:bg-primary-50 rounded"><Check size={14} weight="bold" /></button>
                        <button onClick={handleCancelRename} className="p-1 text-gray-400 hover:bg-gray-200 rounded"><X size={14} weight="bold" /></button>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-sm font-semibold truncate leading-snug">{session.session_title || 'Percakapan Tanpa Judul'}</h4>
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{timeAgo(session.last_active)}</p>
                      </>
                    )}
                  </div>

                  {/* Edit Pencil Icon (Visible on Hover if not editing) */}
                  {editingSessionId !== session.session_id && (
                    <button 
                      onClick={(e) => handleStartRename(e, session)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm transition-all focus:opacity-100"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ──── MAIN CHAT CONTAINER ──── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        
        {/* ──── HEADER ──── */}
        <div className="flex-shrink-0 px-4 py-3 md:px-6 md:py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0">
          
          <div className="flex items-center gap-3">
            {/* Hamburger (Mobile) */}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <List size={22} weight="bold" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
              <Leaf size={20} className="text-primary" weight="fill" />
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-black text-gray-900 leading-tight">Pakar Agronomi AI</h2>
              <p className="text-xs text-gray-500 font-medium">Asisten Analisis & Rekomendasi Pintar</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Lahan Context Dropdown */}
            <div className="w-full sm:w-56 lg:w-64">
              <select
                value={selectedLahan}
                onChange={(e) => setSelectedLahan(e.target.value)}
                className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-xs sm:text-sm font-semibold rounded-xl px-3 sm:px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 cursor-pointer hover:shadow-sm transition-all"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: `right 0.5rem center`,
                  backgroundRepeat: `no-repeat`,
                  backgroundSize: `1.5em 1.5em`,
                }}
              >
                <option value="">+ Konteks Obrolan Umum</option>
                {lahanOptions.map(lahan => (
                  <option key={lahan.id} value={lahan.id}>
                    📍 Lahan: {lahan.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Settings Gear Icon */}
            <button
              onClick={handleOpenModal}
              title="Pengaturan API Key"
              className={`p-2.5 shrink-0 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                keyStored
                  ? 'bg-primary-50 border-primary-100 text-primary hover:bg-primary-100'
                  : 'bg-white border-gray-200 text-gray-400 hover:text-primary hover:border-primary-200'
              }`}
            >
              <GearSix size={20} weight={keyStored ? 'fill' : 'bold'} />
            </button>
          </div>
        </div>

        {/* ──── CHAT HISTORY AREA ──── */}
        {isLoadingHistory ? (
          <HistorySkeleton />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scrollbar bg-white">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[95%] lg:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                        <User size={16} className="text-gray-600" weight="bold" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                        <Leaf size={16} className="text-white" weight="bold" />
                      </div>
                    )}
                  </div>

                  {/* Bubble Body */}
                  <div
                    className={`py-3 px-4 sm:px-5 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-white border border-gray-200 shadow-sm text-gray-900 rounded-tr-sm'
                        : 'bg-[#F8FAFB] text-gray-900 rounded-tl-sm'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none text-[14px] sm:text-[15px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                  </div>

                </div>
              </div>
            ))}

            {/* Loading Indicator (Typing / Fetching) */}
            {isLoading && (
              <div className="flex w-full justify-start animate-fade-in">
                <div className="flex gap-3 max-w-[75%]">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
                    <Leaf size={16} className="text-white" weight="bold" />
                  </div>
                  <div className="py-4 px-5 rounded-2xl bg-[#F8FAFB] rounded-tl-sm flex items-center gap-1.5 h-[50px]">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={scrollRef} className="h-4" />
          </div>
        )}

        {/* ──── INPUT AREA ──── */}
        <div className="flex-shrink-0 px-4 md:px-6 py-4 bg-white border-t border-gray-100 relative">
          <div className="max-w-4xl mx-auto flex items-end gap-2 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || isLoadingHistory}
              placeholder={
                selectedLahan 
                  ? "Tanyakan analisis seputar lahan yang Anda pilih..." 
                  : "Tanyakan apapun tentang agrikultur atau tanaman Anda..."
              }
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-2xl px-5 py-4 pr-16 focus:outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all resize-none text-[15px] custom-scrollbar disabled:opacity-60 disabled:bg-gray-100"
              rows={1}
              style={{ 
                minHeight: '60px', 
                maxHeight: '160px',
                height: 'auto'
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isLoadingHistory}
              className="absolute right-2 bottom-2 h-[44px] w-[44px] flex items-center justify-center bg-primary text-white rounded-xl hover:bg-primary-hover active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              {isLoading ? (
                <CircleNotch size={22} className="animate-spin" weight="bold" />
              ) : (
                <PaperPlaneRight size={22} weight="fill" />
              )}
            </button>
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 mt-3">
            <p className="text-center text-[11px] text-gray-400 font-medium">
              Daya analitik dari Gemini AI. AI dapat membuat kesalahan. Batas auto-pruning riwayat: 25 pesan terbaru.
            </p>
            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${keyStored ? 'bg-primary-50 text-primary border border-primary-100' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
              {keyStored ? '🔑 Menggunakan Custom API Key Pribadi' : '☁️ Menggunakan Server Default Orbitani'}
            </div>
          </div>
        </div>

      </div>

      {/* ──── MODAL: API KEY SETTINGS ──── */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowApiKeyModal(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-scale-in border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowApiKeyModal(false)} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
              <X size={20} weight="bold" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                <Key size={22} className="text-primary" weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Pengaturan API Key</h3>
                <p className="text-xs text-gray-500 font-medium">Opsional — Bring Your Own Key</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Gunakan API Key Gemini pribadi Anda untuk menghindari antrean atau limitasi server. Kunci hanya disimpan di peramban Anda dan <strong className="text-gray-700">tidak pernah dikirim ke server Orbitani</strong>.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-primary" weight="fill" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Cara Mendapatkan API Key Gratis</span>
              </div>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-5 list-decimal leading-relaxed">
                <li>Kunjungi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Google AI Studio</a>.</li>
                <li>Masuk menggunakan Akun Google Anda.</li>
                <li>Klik tombol <strong>"Create API Key"</strong> lalu salin kunci (<code className="bg-gray-200 px-1 rounded text-xs">AIza...</code>).</li>
                <li>Tempelkan kunci tersebut di bawah.</li>
              </ol>
            </div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">API Key Gemini</label>
            <div className="relative mb-6">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={keyStored ? '••••••••  (Kunci Tersimpan)' : 'AIza... Tempelkan kunci Anda di sini'}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKey ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button disabled={!keyStored} onClick={handleDeleteKey} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                <Trash size={16} weight="bold" /> Hapus Kunci
              </button>
              <button onClick={handleSaveKey} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-sm">
                Simpan API Key
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIChat;
