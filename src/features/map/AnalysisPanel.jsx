import { useState, useRef, useEffect } from 'react';
import { 
  X, Hash, Thermometer, Drop, CloudRain, 
  PaperPlaneRight, Robot, User, SpinnerGap, Leaf 
} from '@phosphor-icons/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import api from '../../services/api';

const customMarkdown = {
  h1: ({ children }) => <h1 className="text-lg font-bold mt-2 mb-1 text-primary">{children}</h1>,
  h2: ({ children }) => <h2 className="text-md font-bold mt-2 mb-1 text-primary/90">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold mt-1 text-primary/80">{children}</h3>,
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-sm text-gray-700 dark:text-gray-300">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-secondary">{children}</strong>,
  ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{children}</li>,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-primary/5 dark:bg-primary/20">{children}</thead>,
  th: ({ children }) => <th className="px-3 py-2 text-left font-semibold text-primary dark:text-accent border-b border-gray-200 dark:border-gray-700">{children}</th>,
  tbody: ({ children }) => <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>,
  tr: ({ children }) => <tr className="even:bg-gray-50 dark:even:bg-gray-800/50">{children}</tr>,
  td: ({ children }) => <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{children}</td>,
};

const AnalysisPanel = ({ data, onClose }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya Pakar Agronomi AI. Ada yang ingin dianalisis tentang titik lahan ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  // Reset chat if data point changes completely
  useEffect(() => {
    if (data) {
      setMessages([{ role: 'assistant', content: `Halo! Mari bahas lahan **${data.nama || `Titik #${data.id}`}**. Tanyakan apapun soal kondisi tanah atau iklimnya.` }]);
    }
  }, [data?.id]);

  if (!data) return null;

  // Build hidden context string from active point data
  const buildContext = () => {
    const d = data;
    return `[Konteks Lahan "${d.nama || 'Titik #' + d.id}": N=${d.nitrogen ?? '-'}, P=${d.fosfor ?? '-'}, K=${d.kalium ?? '-'}, pH=${d.ph ?? '-'}, Suhu=${d.suhu ?? '-'}°C, Kelembapan=${d.kelembapan ?? '-'}%, Curah_Hujan=${d.curah_hujan ?? '-'}mm]`;
  };

  const handleSendChat = async () => {
    const text = input.trim();
    if (!text || isChatLoading) return;

    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsChatLoading(true);

    try {
      const contextMessage = `${buildContext()} Pertanyaan User: ${text}`;
      const response = await api.post('/api/chat/ask', { message: contextMessage });
      
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data?.answer || response.data?.response || "Maaf, terjadi kendala memproses data AI." }
      ]);
    } catch (err) {
      if (!err.response || err.response.status !== 401) {
        toast.error("Gagal mengirim pertanyaan ke Pakar AI.");
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeepAnalysis = async () => {
    if (isChatLoading) return;
    setIsChatLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: '🛰️ Minta analisis mendalam lahan ini...' }]);

    try {
      const deepPrompt = `${buildContext()} Analisis mendalam: evaluasi kesuburan, rekomendasi pupuk (dosis & jenis), potensi masalah, dan saran prioritas.`;
      const response = await api.post('/api/chat/ask', { message: deepPrompt });
      
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: response.data?.answer || response.data?.response || "Analisis mendalam selesai." }
      ]);
    } catch (err) {
      if (!err.response || err.response.status !== 401) {
        toast.error("Gagal melakukan analisis mendalam.");
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isChatLoading) handleSendChat();
    }
  };

  return (
    <div className="absolute lg:fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-tl-none shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-300 ease-out border-t border-gray-200 dark:border-gray-800 flex flex-col h-[75vh] md:h-[65vh] lg:h-auto lg:top-16 lg:bottom-0 lg:left-auto lg:right-0 lg:w-[450px] lg:border-t-0 lg:border-l lg:rounded-none animate-slide-up lg:animate-slide-left">
      
      {/* Handle for mobile / Close button for Desktop */}
      <div className="w-full flex justify-center pt-3 pb-2 lg:hidden" onClick={onClose} style={{ cursor: 'pointer' }}>
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-neutral-text dark:text-white flex items-center gap-2">
            <Leaf weight="duotone" className="text-primary dark:text-accent" size={24} />
            {data.nama || `Lahan #${data.id}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded-full">
            {data.jenis_tanaman || 'Unknown Crop'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
        >
          <X size={20} weight="bold" className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* Content Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 custom-scrollbar">
        
        {/* 1. Stats Display */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Hash size={16} className="text-secondary" /> Data Sensor Fisik
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {/* NPK Block */}
            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-gray-800 dark:to-gray-800 p-4 rounded-2xl border border-primary/10 dark:border-gray-700">
              <span className="text-xs font-bold text-primary dark:text-accent mb-2 block">Kandungan NPK</span>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Nitrogen</span>
                <span className="font-semibold text-neutral-text dark:text-gray-200">{data.nitrogen ?? '-'} <span className="text-[10px] font-normal text-gray-400">mg/kg</span></span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Fosfor</span>
                <span className="font-semibold text-neutral-text dark:text-gray-200">{data.fosfor ?? '-'} <span className="text-[10px] font-normal text-gray-400">mg/kg</span></span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Kalium</span>
                <span className="font-semibold text-neutral-text dark:text-gray-200">{data.kalium ?? '-'} <span className="text-[10px] font-normal text-gray-400">mg/kg</span></span>
              </div>
            </div>

            {/* Iklim Block */}
            <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
              <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-1"><Thermometer size={14} /> pH</span>
                <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{data.ph ?? '-'}</span>
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mb-1"><Thermometer size={14} /> Suhu</span>
                <span className="text-lg font-bold text-red-700 dark:text-red-300">{data.suhu ? `${data.suhu}°C` : '-'}</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1"><Drop size={14} /> Lembab</span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{data.kelembapan ? `${data.kelembapan}%` : '-'}</span>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-2xl border border-cyan-100 dark:border-cyan-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mb-1"><CloudRain size={14} /> Curah Hujan</span>
                <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{data.curah_hujan ? `${data.curah_hujan} mm` : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. AI Chat Interface */}
        <div className="flex flex-col h-[400px] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 shadow-inner">
          <div className="bg-primary/5 dark:bg-primary/20 px-4 py-3 border-b border-primary/10 dark:border-primary/30 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Robot size={22} weight="duotone" className="text-primary dark:text-accent" />
              <h4 className="text-sm font-semibold text-primary dark:text-accent">Konsultasi Pakar AI</h4>
            </div>
            <button
              onClick={handleDeepAnalysis}
              disabled={isChatLoading}
              className="px-3 py-1.5 bg-secondary text-white text-xs font-semibold rounded-lg hover:bg-secondary-hover transition-colors disabled:opacity-50"
            >
              Analisis Mendalam AI
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-accent/20 text-primary dark:text-accent'}`}>
                  {msg.role === 'user' ? <User size={14} weight="bold" /> : <Robot size={14} weight="bold" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-primary text-white rounded-tr-sm border-transparent'
                      : 'bg-white dark:bg-gray-800 text-neutral-text dark:text-gray-100 rounded-tl-sm border-gray-100 dark:border-gray-700'
                  }`}>
                  {msg.role === 'skeleton' ? (
                    <div className="animate-pulse space-y-2 w-56">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={customMarkdown}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/20 text-primary dark:text-accent flex items-center justify-center flex-shrink-0">
                  <Robot size={14} weight="bold" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tanya rekomendasi pupuk..."
                disabled={isChatLoading}
                rows={1}
                className="w-full resize-none bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-primary px-4 py-3 pr-12 text-sm outline-none transition-all dark:text-white dark:placeholder-gray-400 custom-scrollbar disabled:opacity-50"
              />
              <button
                onClick={handleSendChat}
                disabled={!input.trim() || isChatLoading}
                className="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChatLoading ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneRight size={16} weight="fill" />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisPanel;
