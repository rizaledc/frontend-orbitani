import { useState, useRef, useEffect } from 'react';
import { Leaf, User, PaperPlaneRight, CircleNotch, GearSix, Eye, EyeSlash, Key, Trash, X, Info } from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { sendQuickChat, analyzeLahan } from '../../services/aiChatService';
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

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya adalah **Pakar AI Agronomi Orbitani**. Ada masalah spesifik pada lahan atau tanaman Anda yang bisa saya analisis hari ini?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
  }, []);

  useEffect(() => {
    // Smooth scroll to bottom every time messages update or loading state changes
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const fetchLahanOptions = async () => {
    try {
      const data = await getAllLahan();
      setLahanOptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed fetching lahan:', err);
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

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setIsLoading(true);

    try {
      let responseData;
      if (selectedLahan) {
        // AI Analysis context using specific Lahan ID
        responseData = await analyzeLahan(text, selectedLahan);
      } else {
        // General Agronomy knowledge
        responseData = await sendQuickChat(text);
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: responseData.answer || responseData.response || 'Maaf, respon tidak dapat diproses saat ini.'
        }
      ]);
    } catch (err) {
      console.error(err);
      // Wait handling UI. The global toast catches 503 from backend.
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

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden relative">
      
      {/* ──── HEADER & CONTEXT SELECTOR ──── */}
      <div className="flex-shrink-0 px-4 py-3 md:px-8 md:py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
            <Leaf size={20} className="text-primary" weight="fill" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Pakar Agronomi AI</h2>
            <p className="text-xs text-gray-500 font-medium">Asisten Analisis & Rekomendasi Pintar</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Lahan Context Dropdown using Native Tailwind Styling */}
          <div className="w-full md:w-64">
            <select
              value={selectedLahan}
              onChange={(e) => setSelectedLahan(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400 cursor-pointer hover:shadow-sm transition-all"
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
            className={`p-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm ${
              keyStored
                ? 'bg-primary-50 border-primary-100 text-primary hover:bg-primary-100'
                : 'bg-white border-gray-200 text-gray-400 hover:text-primary hover:border-primary-200'
            }`}
          >
            <GearSix size={20} weight={keyStored ? 'fill' : 'bold'} />
          </button>
        </div>
      </div>

      {/* ──── CHAT AREA ──── */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 custom-scrollbar bg-white">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              
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
                className={`py-3 px-5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-white border border-gray-200 shadow-sm text-gray-900 rounded-tr-sm'
                    : 'bg-[#F8FAFB] text-gray-900 rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none text-[15px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
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

      {/* ──── INPUT AREA ──── */}
      <div className="flex-shrink-0 px-4 md:px-8 py-4 bg-white border-t border-gray-100 relative">
        <div className="max-w-4xl mx-auto flex items-end gap-2 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
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
            disabled={!input.trim() || isLoading}
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
            Daya analitik dari Gemini AI. AI dapat membuat kesalahan, periksa kembali rekomendasi kritis.
          </p>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${keyStored ? 'bg-primary-50 text-primary border border-primary-100' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
            {keyStored ? '🔑 Menggunakan Custom API Key Pribadi' : '☁️ Menggunakan Server Default Orbitani'}
          </div>
        </div>
      </div>

      {/* ──── MODAL: API KEY SETTINGS ──── */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowApiKeyModal(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Content */}
          <div
            className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-scale-in border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X size={20} weight="bold" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center">
                <Key size={22} className="text-primary" weight="fill" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Pengaturan API Key</h3>
                <p className="text-xs text-gray-500 font-medium">Opsional — Bring Your Own Key</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              Gunakan API Key Gemini pribadi Anda untuk menghindari antrean atau limitasi server. Kunci hanya disimpan di peramban Anda dan <strong className="text-gray-700">tidak pernah dikirim ke server Orbitani</strong>.
            </p>

            {/* Guide Box */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-5 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Info size={16} className="text-primary" weight="fill" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Cara Mendapatkan API Key Gratis</span>
              </div>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-5 list-decimal leading-relaxed">
                <li>Kunjungi <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Google AI Studio</a>.</li>
                <li>Masuk menggunakan Akun Google Anda (Gmail, Workspace, dll).</li>
                <li>Klik tombol <strong className="text-gray-800 dark:text-gray-200">"Create API Key"</strong> di halaman utama.</li>
                <li>Pilih atau buat Google Cloud Project baru.</li>
                <li>Salin API Key Anda (diawali dengan <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">AIza...</code>).</li>
                <li>Tempelkan kunci tersebut di bawah.</li>
              </ol>
              <p className="text-xs text-primary font-semibold mt-3 flex items-center gap-1">
                ✅ Google menyediakan kuota gratis yang besar. Tidak perlu kartu kredit!
              </p>
            </div>

            {/* Input Field */}
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">API Key Gemini</label>
            <div className="relative mb-6">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={keyStored ? '••••••••  (Kunci Tersimpan)' : 'AIza... Tempelkan kunci Anda di sini'}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showKey ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleDeleteKey}
                disabled={!keyStored}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash size={16} weight="bold" />
                Hapus Kunci
              </button>
              <button
                onClick={handleSaveKey}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
              >
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
