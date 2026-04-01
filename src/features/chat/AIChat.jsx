import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { sendQuickChat, analyzeLahan } from '../../services/chatService';

/* Shimmer skeleton for analysis loading (10-20s) */
const AnalysisSkeleton = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full skeleton-shimmer flex-shrink-0" />
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 skeleton-shimmer rounded-lg w-3/4" />
      <div className="h-4 skeleton-shimmer rounded-lg w-full" />
      <div className="h-4 skeleton-shimmer rounded-lg w-5/6" />
      <div className="h-4 skeleton-shimmer rounded-lg w-2/3" />
      <div className="h-3 skeleton-shimmer rounded-lg w-1/2 mt-2" />
      <div className="h-3 skeleton-shimmer rounded-lg w-3/5" />
    </div>
  </div>
);

/* Typing indicator dots animation */
const TypingIndicator = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
      <Bot className="w-4 h-4 text-accent" />
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

/* Markdown custom components with branding */
const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-lg font-bold mt-3 mb-1.5 text-primary dark:text-accent">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-bold mt-3 mb-1 text-primary dark:text-accent">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold mt-2 mb-1 text-primary dark:text-accent/80">{children}</h3>
  ),
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-secondary">{children}</strong>,
  em: ({ children }) => <em className="italic text-gray-600 dark:text-gray-300">{children}</em>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent px-1.5 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3 rounded-lg border border-gray-200 dark:border-gray-600">
      <table className="min-w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-primary/5 dark:bg-primary/30">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left font-semibold text-primary dark:text-accent border-b border-gray-200 dark:border-gray-600">
      {children}
    </th>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100 dark:divide-gray-700">{children}</tbody>,
  tr: ({ children, ...props }) => {
    // Zebra striping via even/odd
    return <tr className="even:bg-gray-50 dark:even:bg-gray-800/50">{children}</tr>;
  },
  td: ({ children }) => (
    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-secondary pl-3 my-2 text-gray-600 dark:text-gray-400 italic">
      {children}
    </blockquote>
  ),
};

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Halo! 👋 Saya **Pakar Agronomi AI** dari Orbitani.\n\nAnda bisa bertanya seputar:\n- 🌱 Teknik budidaya tanaman\n- 🧪 Analisis tanah & pupuk\n- 🛰️ Analisis lahan mendalam\n\nKetik pertanyaan Anda di bawah!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isAnalyzing]);

  // Countdown timer for 429 rate limit
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.success('Anda bisa bertanya lagi sekarang!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRateLimit = (err) => {
    const retryAfter = err.response?.data?.retry_after_seconds || 60;
    setCountdown(retryAfter);
    toast.error(`Rate limit tercapai. Tunggu ${retryAfter} detik.`, {
      duration: retryAfter * 1000,
      icon: '⏳',
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading || isAnalyzing || countdown > 0) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const data = await sendQuickChat(text);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || data.response || 'Maaf, saya tidak bisa memproses jawaban.',
        },
      ]);
    } catch (err) {
      if (err.response?.status === 429) {
        handleRateLimit(err);
      }
      // non-429 errors already handled by global interceptor
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleAnalyzeLahan = async (lahanId) => {
    if (isLoading || isAnalyzing || countdown > 0) return;
    setIsAnalyzing(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: `🛰️ Analisis mendalam lahan #${lahanId}` },
    ]);

    try {
      const prompt = `Berikan analisis mendalam untuk lahan ID #${lahanId}. Sertakan evaluasi kesuburan, rekomendasi pupuk, dan saran tindakan prioritas.`;
      const data = await sendQuickChat(prompt);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || data.response || 'Analisis selesai tanpa data.',
        },
      ]);
    } catch (err) {
      if (err.response?.status === 429) handleRateLimit(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isAnalyzing) handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 lg:px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-neutral-text dark:text-white">Pakar Agronomi AI</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse" />
              Powered by Gemini
            </p>
          </div>
        </div>
        {countdown > 0 && (
          <div className="flex items-center gap-2 text-sm text-secondary bg-secondary/10 px-3 py-1.5 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span>Tunggu {countdown}s</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-accent/15 text-accent'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] lg:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm'
                  : 'bg-white dark:bg-gray-800 text-neutral-text dark:text-gray-100 rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-700'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && <TypingIndicator />}

        {/* Analysis shimmer skeleton */}
        {isAnalyzing && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-4 shadow-sm border border-gray-100 dark:border-gray-700 max-w-[85%] lg:max-w-[65%]">
            <div className="flex items-center gap-2 text-sm text-accent mb-3">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="font-medium">Menganalisis lahan... (10-20 detik)</span>
            </div>
            <AnalysisSkeleton />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-gray-800 border-t dark:border-gray-700 px-4 lg:px-6 py-4 flex-shrink-0">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={countdown > 0 ? `Tunggu ${countdown} detik...` : 'Ketik pertanyaan Anda...'}
              disabled={isLoading || isAnalyzing || countdown > 0}
              rows={1}
              className="w-full resize-none bg-neutral dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm px-4 py-3 max-h-32 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isAnalyzing || countdown > 0}
            className="h-[46px] w-[46px] bg-primary text-white rounded-xl hover:bg-primary-hover active:scale-95 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20"
          >
            {isLoading || isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
