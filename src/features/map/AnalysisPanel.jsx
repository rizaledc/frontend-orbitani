import { useState, useRef, useEffect } from 'react';
import logger from '../../utils/logger';
import {
  X, Hash, Thermometer, Droplets, CloudRain,
  Send, Sparkles, User, Loader2, Leaf,
  Sprout, RefreshCw, Clock, FlaskConical,
  Layers, TestTube
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { getLahanData } from '../../services/lahanService';
import OrbitaniLoader from '../../components/OrbitaniLoader';

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

// ── Field accessors — handles naming variants from the backend ──
const getN = (r) => r?.N ?? r?.nitrogen ?? r?.n ?? null;
const getP = (r) => r?.P ?? r?.fosfor ?? r?.phosphorus ?? r?.p ?? null;
const getK = (r) => r?.K ?? r?.kalium ?? r?.potassium ?? r?.k ?? null;
const getPH = (r) => r?.pH ?? r?.ph ?? null;
const getTemp = (r) => r?.temperature ?? r?.temp ?? r?.suhu ?? r?.tci ?? null;
const getHumid = (r) => r?.humidity ?? r?.humid ?? r?.kelembapan ?? r?.ndti ?? null;
const getLat = (r) => Array.isArray(r) ? r[1] : r?.lat ?? r?.latitude ?? null;
const getLon = (r) => Array.isArray(r) ? r[0] : r?.lon ?? r?.lng ?? r?.longitude ?? null;
const getRain = (r) => r?.rainfall ?? r?.rain ?? r?.curah_hujan ?? null;
const getReko = (r) => r?.rekomendasi ?? r?.recommendation ?? r?.ai_recommendation ?? r?.label ?? '-';
const fmt = (v, d = 1) => v != null ? Number(v).toFixed(d) : '–';

const calcStats = (arr, getter) => {
  const vals = arr.map(getter).filter((v) => v != null);
  if (!vals.length) return null;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  return { min: Math.min(...vals), max: Math.max(...vals), mean, std };
};

const pearson = (arr, g1, g2) => {
  const pairs = arr.map((pt) => [g1(pt), g2(pt)]).filter(([a, b]) => a != null && b != null);
  const n = pairs.length;
  if (n < 2) return null;
  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const dx = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0));
  const dy = Math.sqrt(ys.reduce((s, y) => s + (y - my) ** 2, 0));
  return dx && dy ? num / (dx * dy) : 0;
};


// ── Feature 4: Static SHAP values from notebook analysis ──
const SHAP_DATA = [
  { label: 'Humidity', value: 0.0317 },
  { label: 'N', value: 0.0267 },
  { label: 'K', value: 0.0252 },
  { label: 'Rainfall', value: 0.0251 },
  { label: 'P', value: 0.0229 },
  { label: 'Temperature', value: 0.0098 },
  { label: 'pH', value: 0.0046 },
];
const SHAP_MAX = SHAP_DATA[0].value;


const AnalysisPanel = ({ data, lahanDetail, lahanBiofisik, samplePoints, onClose, onAnalyze, isAnalyzing, onSamplesLoaded }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya Pakar Agronomi AI. Ada yang ingin dianalisis tentang titik lahan ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [detailLahan, setDetailLahan] = useState(null);
  const [samples, setSamples] = useState([]);
  const [rekomendasi, setRekomendasi] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!data?.id) return;
    setSamples([]);
    setRekomendasi([]);
    const fetchSamples = async () => {
      try {
        const backendUrl = import.meta.env.VITE_API_URL ||
          'https://backend-orbitani-fkdzbherbbbzatd2.southeastasia-01.azurewebsites.net';
        const token = localStorage.getItem('orbitani_token') ||
                      localStorage.getItem('access_token') ||
                      localStorage.getItem('token') ||
                      sessionStorage.getItem('token');
        const res = await fetch(
          `${backendUrl}/api/lahan/${data.id}/data`,
          { headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }}
        );
        const result = await res.json();

        // Deduplicate: keep only the 10 most-recent satellite points for THIS lahan
        const rawPoints = Array.isArray(result?.satellite_data) ? result.satellite_data
          : Array.isArray(result?.satellite_results) ? result.satellite_results
          : Array.isArray(result?.data) ? result.data : [];
        const allPoints = rawPoints.filter(
          (p) => !p.lahan_id || String(p.lahan_id) === String(data.id)
        );
        const latestTime = allPoints.length > 0
          ? Math.max(...allPoints.map((p) => new Date(p.created_at).getTime()))
          : 0;
        const latestDate = new Date(latestTime).toISOString().split('T')[0];
        const points = allPoints
          .filter((p) => p.created_at?.startsWith(latestDate) || allPoints.length <= 10)
          .slice(0, 10);
        setSamples(points);
        onSamplesLoaded?.(points);

        // Extract recommendations — backend may nest under lahan, data, or flat
        const reko = result?.lahan?.hasil_rekomendasi ||
                     result?.hasil_rekomendasi ||
                     result?.data?.hasil_rekomendasi || [];
        setRekomendasi(Array.isArray(reko) ? reko : []);
      } catch (err) {
        setSamples([]);
        setRekomendasi([]);
      }
    };
    fetchSamples();
  }, [data?.id, refreshKey]);

  useEffect(() => {
    if (messages.length > 1 || isChatLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatLoading]);

  useEffect(() => {
    if (data) {
      setMessages([{ role: 'assistant', content: `Halo! Mari bahas lahan **${data.nama || `Titik #${data.id}`}**. Tanyakan apapun soal kondisi tanah atau iklimnya.` }]);

      setDetailLahan(null);
      getLahanData(data.id)
        .then(res => setDetailLahan(res))
        .catch(err => logger.error("Gagal memuat detail:", err));
    }
  }, [data?.id]);

  if (!data) return null;

  // Deep fallback chain to find satellite_results wherever it lives
  const finalSamples =
    (Array.isArray(samplePoints) && samplePoints.length > 0 ? samplePoints : null) ??
    (Array.isArray(data?.satellite_results) && data.satellite_results.length > 0 ? data.satellite_results : null) ??
    (Array.isArray(lahanDetail?.satellite_results) && lahanDetail.satellite_results.length > 0 ? lahanDetail.satellite_results : null) ??
    (Array.isArray(lahanDetail?.data?.satellite_results) && lahanDetail.data.satellite_results.length > 0 ? lahanDetail.data.satellite_results : null) ??
    (Array.isArray(samples) && samples.length > 0 ? samples : []);

  // ── Derived: individual sample points from satellite analysis ──
  const nStats = finalSamples.length > 0 ? calcStats(finalSamples, getN) : null;
  const pStats = finalSamples.length > 0 ? calcStats(finalSamples, getP) : null;
  const kStats = finalSamples.length > 0 ? calcStats(finalSamples, getK) : null;
  const nMax = nStats?.max || 1;

  // ── TOP 3 rekomendasi dari titik sampel ──
  const rekoCounts = {};
  finalSamples.forEach((pt) => {
    const r = getReko(pt);
    if (r && r !== '-') rekoCounts[r] = (rekoCounts[r] || 0) + 1;
  });
  const top3Reko = Object.entries(rekoCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tanaman, count]) => ({ tanaman, pct: Math.round((count / finalSamples.length) * 100) }));
  const rekoBarColors = ['#16a34a', '#2563eb', '#9333ea'];
  const rekoRankColors = [
    { bg: '#dcfce7', color: '#166534' },
    { bg: '#dbeafe', color: '#1e40af' },
    { bg: '#f3e8ff', color: '#6b21a8' },
  ];

  const biofisik = lahanBiofisik ?? lahanDetail?.rata_rata_fitur ?? lahanDetail?.data?.rata_rata_fitur ?? detailLahan?.rata_rata_fitur ?? detailLahan?.data?.rata_rata_fitur ?? data?.rata_rata_fitur ?? data;
  const bioN = biofisik?.nitrogen ?? biofisik?.N ?? biofisik?.n ?? data?.nitrogen;
  const bioP = biofisik?.fosfor ?? biofisik?.P ?? biofisik?.p ?? data?.fosfor;
  const bioK = biofisik?.kalium ?? biofisik?.K ?? biofisik?.k ?? data?.kalium;
  const bioPH = biofisik?.ph ?? biofisik?.pH ?? data?.ph;
  const bioSuhu = biofisik?.suhu ?? biofisik?.temperature ?? data?.suhu;
  const bioLembab = biofisik?.kelembapan ?? biofisik?.humidity ?? data?.kelembapan;
  const bioHujan = biofisik?.curah_hujan ?? biofisik?.rainfall ?? data?.curah_hujan;

  const buildContext = () => {
    return `[Konteks Lahan "${data.nama || 'Titik #' + data.id}": N=${bioN ?? '-'}, P=${bioP ?? '-'}, K=${bioK ?? '-'}, pH=${bioPH ?? '-'}, Suhu=${bioSuhu ?? '-'}°C, Kelembapan=${bioLembab ?? '-'}%, Curah_Hujan=${bioHujan ?? '-'}mm]`;
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
        { role: 'assistant', content: response.data?.answer || response.data?.response || 'Maaf, terjadi kendala memproses data AI.' }
      ]);
    } catch (err) {
      if (!err.response || err.response.status !== 401) toast.error('Gagal mengirim pertanyaan ke Pakar AI.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDeepAnalysis = async () => {
    if (isChatLoading) return;
    setIsChatLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: 'Minta analisis mendalam lahan ini...' }]);
    try {
      const deepPrompt = `${buildContext()} Analisis mendalam: evaluasi kesuburan, rekomendasi pupuk (dosis & jenis), potensi masalah, dan saran prioritas.`;
      const response = await api.post('/api/chat/ask', { message: deepPrompt });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.data?.answer || response.data?.response || 'Analisis mendalam selesai.' }
      ]);
    } catch (err) {
      if (!err.response || err.response.status !== 401) toast.error('Gagal melakukan analisis mendalam.');
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!isChatLoading) handleSendChat(); }
  };

  const getRecos = (d) => {
    if (Array.isArray(d?.hasil_rekomendasi) && d.hasil_rekomendasi.length > 0) return d.hasil_rekomendasi;
    if (Array.isArray(d?.lahan?.hasil_rekomendasi) && d.lahan.hasil_rekomendasi.length > 0) return d.lahan.hasil_rekomendasi;
    if (Array.isArray(d?.data?.hasil_rekomendasi) && d.data.hasil_rekomendasi.length > 0) return d.data.hasil_rekomendasi;
    if (Array.isArray(d?.ai_recommendation) && d.ai_recommendation.length > 0) return d.ai_recommendation;
    if (typeof d?.ai_recommendation === 'string' && d.ai_recommendation) return [{ tanaman: d.ai_recommendation, persentase: 100 }];
    if (typeof d?.crop_recommendation === 'string' && d.crop_recommendation) return [{ tanaman: d.crop_recommendation, persentase: 100 }];
    return [];
  };

  return (
    <div className="absolute lg:fixed bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-tl-none shadow-[0_-10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.6)] transform transition-transform duration-300 ease-out border-t border-gray-200 dark:border-gray-800 flex flex-col h-[75vh] md:h-[65vh] lg:h-auto lg:top-16 lg:bottom-0 lg:left-auto lg:right-0 lg:w-[450px] lg:border-t-0 lg:border-l lg:rounded-none animate-slide-up lg:animate-slide-left">

      {/* Handle for mobile */}
      <div className="w-full flex justify-center pt-3 pb-2 lg:hidden" onClick={onClose} style={{ cursor: 'pointer' }}>
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
      </div>

      {/* Header */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-neutral-text dark:text-white flex items-center gap-2">
            {data.nama || `Lahan #${data.id}`}
          </h3>
          {(data.keterangan || data.deskripsi) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {data.keterangan || data.deskripsi}
            </p>
          )}
          {(data.terakhir_dianalisis || data.last_analyzed_at) && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
              <Clock size={11} />
              Analisis terakhir:{' '}
              {new Date(data.terakhir_dianalisis || data.last_analyzed_at).toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          )}
        </div>
        <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <X size={20} strokeWidth={2.5} className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">

        {/* ── AI Analyze Button ── */}
        {onAnalyze && (() => {
          const hasResult = rekomendasi.length > 0 || getRecos(data).length > 0;
          return (
            <button
              onClick={async () => { await onAnalyze?.(); setRefreshKey((prev) => prev + 1); }}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isAnalyzing ? (
                <><OrbitaniLoader size="sm" /><span>Menganalisis Lahan...</span></>
              ) : (
                <>
                  {hasResult ? <RefreshCw size={16} strokeWidth={2.5} /> : <Sprout size={16} strokeWidth={2} />}
                  <span>{hasResult ? 'Analisis Ulang / Perbarui' : 'Analisis Tanaman (AI)'}</span>
                </>
              )}
            </button>
          );
        })()}

        {/* ═══════════════════════════════════════════
            FEATURE 5 — Kondisi Biofisik Lahan
            ═══════════════════════════════════════════ */}
        <div>
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Kondisi Biofisik Lahan
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Rata-rata 10 titik sampel satelit</p>
          </div>

          {/* NPK — 3 kartu bersebelahan */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-lime-50 dark:bg-lime-900/10 border border-lime-200 dark:border-lime-500/20 rounded-2xl p-3 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-lime-600 dark:text-lime-400 flex items-center justify-center gap-1.5 mb-1">
                <FlaskConical size={14} strokeWidth={2} className="text-gray-500" /> Nitrogen (N)
              </span>
              <span className="text-xl font-bold text-lime-700 dark:text-lime-300 block leading-tight">{bioN != null ? Number(bioN).toFixed(1) : '–'}</span>
              <span className="text-[10px] text-gray-400">mg/kg</span>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-3 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1.5 mb-1">
                <Layers size={14} strokeWidth={2} className="text-gray-500" /> Fosfor (P)
              </span>
              <span className="text-xl font-bold text-orange-700 dark:text-orange-300 block leading-tight">{bioP != null ? Number(bioP).toFixed(1) : '–'}</span>
              <span className="text-[10px] text-gray-400">mg/kg</span>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-3 text-center flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 flex items-center justify-center gap-1.5 mb-1">
                <Sprout size={14} strokeWidth={2} className="text-gray-500" /> Kalium (K)
              </span>
              <span className="text-xl font-bold text-purple-700 dark:text-purple-300 block leading-tight">{bioK != null ? Number(bioK).toFixed(1) : '–'}</span>
              <span className="text-[10px] text-gray-400">mg/kg</span>
            </div>
          </div>

          {/* Climate — grid 2×2 tanpa label keterangan */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-500/20 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1.5 mb-1">
                <TestTube size={14} strokeWidth={2} className="text-gray-500" /> PH
              </span>
              <span className="text-2xl font-bold text-orange-700 dark:text-orange-300">{bioPH != null ? Number(bioPH).toFixed(2) : '–'}</span>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-500/20 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-1">
                <Thermometer size={14} strokeWidth={2} className="text-gray-500" /> SUHU
              </span>
              <span className="text-2xl font-bold text-red-700 dark:text-red-300">{bioSuhu != null ? `${Number(bioSuhu).toFixed(1)}°C` : '–'}</span>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 mb-1">
                <Droplets size={14} strokeWidth={2} className="text-gray-500" /> LEMBAB
              </span>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{bioLembab != null ? `${Number(bioLembab).toFixed(1)}%` : '–'}</span>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-2xl border border-cyan-100 dark:border-cyan-500/20 flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 mb-1">
                <CloudRain size={14} strokeWidth={2} className="text-gray-500" /> CURAH HUJAN
              </span>
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{bioHujan != null ? `${Number(bioHujan).toFixed(1)} mm` : '–'}</span>
            </div>
          </div>
        </div>

        {/* ── Rekomendasi Tanaman TOP 3 ── */}
        <div style={{ background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '12px', padding: '16px' }}>
          <div className="mb-2.5 text-[13px] font-bold text-[#065f46] dark:text-green-600">
            Rekomendasi Tanaman {top3Reko.length > 0 && <span className="font-normal text-[11px] text-gray-400 ml-1">dari {finalSamples.length} titik</span>}
          </div>
          {top3Reko.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>Belum dianalisis — klik tombol di atas untuk memulai.</p>
          ) : top3Reko.map(({ tanaman, pct }, idx) => (
            <div key={tanaman} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: idx < top3Reko.length - 1 ? '8px' : 0 }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: rekoRankColors[idx].bg, color: rekoRankColors[idx].color, fontSize: 10, fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
              <span style={{ width: 88, fontSize: 13, fontWeight: '600', color: '#1f2937', textTransform: 'capitalize', flexShrink: 0 }}>{tanaman}</span>
              <div style={{ flex: 1, background: '#d1fae5', borderRadius: 999, height: 8 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: rekoBarColors[idx], borderRadius: 999 }} />
              </div>
              <span style={{ width: 34, textAlign: 'right', fontSize: 12, fontWeight: 'bold', color: rekoBarColors[idx], flexShrink: 0 }}>{pct}%</span>
            </div>
          ))}
        </div>

        {/* ═══════════════════════════════════════════
            FEATURE 2 — Data Per Titik Sampel
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
            Data Per Titik Sampel
          </h4>

          {finalSamples.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Data per titik belum tersedia. Lakukan analisis ulang.
            </p>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {['No', 'Lat', 'Long', 'N', 'P', 'K', 'pH', 'Suhu', 'Lembab', 'Hujan', 'Rekomendasi'].map((h) => (
                      <th key={h} className="px-2.5 py-2 text-left font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap border-b border-gray-200 dark:border-gray-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {finalSamples.map((pt, idx) => (
                    <tr key={idx} className="even:bg-gray-50/60 dark:even:bg-gray-800/30">
                      <td className="px-2.5 py-2 font-bold text-gray-400">{idx + 1}</td>
                      <td className="px-2.5 py-2 text-gray-500 dark:text-gray-400 font-mono text-[10px]">{fmt(getLat(pt), 5)}</td>
                      <td className="px-2.5 py-2 text-gray-500 dark:text-gray-400 font-mono text-[10px]">{fmt(getLon(pt), 5)}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getN(pt))}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getP(pt))}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getK(pt))}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getPH(pt), 2)}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getTemp(pt))}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getHumid(pt))}</td>
                      <td className="px-2.5 py-2 text-gray-700 dark:text-gray-300">{fmt(getRain(pt), 0)}</td>
                      <td className="px-2.5 py-2 font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">{getReko(pt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* NPK stats */}
            {(nStats || pStats || kStats) && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[{ label: 'N', stats: nStats }, { label: 'P', stats: pStats }, { label: 'K', stats: kStats }].map(({ label, stats }) =>
                  stats ? (
                    <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label} (mg/kg)</p>
                      <div className="space-y-0.5 text-[11px]">
                        <div className="flex justify-between"><span className="text-gray-500">Min</span><span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(stats.min)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Rata</span><span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(stats.mean)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Max</span><span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(stats.max)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Std</span><span className="font-semibold text-gray-700 dark:text-gray-300">{fmt(stats.std)}</span></div>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            FEATURE 3A — Radar Chart Profil Lahan
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Profil Kondisi Lahan
          </h4>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Nilai dinormalisasi per rentang agronomi standar</p>
          {finalSamples.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Data belum tersedia. Lakukan analisis ulang.</p>
          ) : (() => {
            const avg = (getter, max) => {
              const vals = finalSamples.map(getter).filter((v) => v != null);
              if (!vals.length) return 0;
              return Math.min(100, Math.round((vals.reduce((s, v) => s + v, 0) / vals.length / max) * 100));
            };
            const radarData = [
              { subject: 'N', value: avg(getN, 200), fullMark: 100 },
              { subject: 'P', value: avg(getP, 100), fullMark: 100 },
              { subject: 'K', value: avg(getK, 300), fullMark: 100 },
              { subject: 'pH', value: avg(getPH, 14), fullMark: 100 },
              { subject: 'Suhu', value: avg(getTemp, 45), fullMark: 100 },
              { subject: 'Lembab', value: avg(getHumid, 100), fullMark: 100 },
            ];
            return (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 4, right: 16, bottom: 4, left: 16 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} />
                  <RechartsTooltip
                    formatter={(val, _name, entry) => [`${val}%`, entry.payload.subject]}
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            );
          })()}
        </div>

        {/* ═══════════════════════════════════════════
            FEATURE 3B — Correlation Heatmap
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Korelasi Antar Variabel
          </h4>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3">Koefisien Pearson dari {finalSamples.length} titik sampel</p>
          {finalSamples.length < 3 ? (
            <p className="text-sm text-gray-400 text-center py-4">Perlu minimal 3 titik sampel.</p>
          ) : (() => {
            const VARS = [
              { key: 'N', getter: getN },
              { key: 'P', getter: getP },
              { key: 'K', getter: getK },
              { key: 'pH', getter: getPH },
              { key: 'Suhu', getter: getTemp },
              { key: 'Lembab', getter: getHumid },
            ];
            const corrColor = (r) => {
              if (r === null) return { bg: '#f3f4f6', text: '#9ca3af' };
              if (r >= 0.6) return { bg: '#dcfce7', text: '#15803d' };
              if (r >= 0.3) return { bg: '#f0fdf4', text: '#16a34a' };
              if (r >= -0.3) return { bg: '#f9fafb', text: '#6b7280' };
              if (r >= -0.6) return { bg: '#fff7ed', text: '#c2410c' };
              return { bg: '#fef2f2', text: '#991b1b' };
            };
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] border-separate border-spacing-0.5">
                  <thead>
                    <tr>
                      <th className="w-10" />
                      {VARS.map((v) => (
                        <th key={v.key} className="font-bold text-gray-500 dark:text-gray-400 text-center pb-1 w-10">{v.key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {VARS.map((vRow, i) => (
                      <tr key={vRow.key}>
                        <td className="font-bold text-gray-500 dark:text-gray-400 pr-1.5 text-right">{vRow.key}</td>
                        {VARS.map((vCol, j) => {
                          const r = i === j ? 1 : pearson(finalSamples, vRow.getter, vCol.getter);
                          const { bg, text } = corrColor(r);
                          return (
                            <td
                              key={vCol.key}
                              className="rounded font-semibold text-center py-1.5"
                              style={{ background: bg, color: text }}
                              title={r !== null ? `${vRow.key} × ${vCol.key}: ${Number(r).toFixed(2)}` : '–'}
                            >
                              {i === j ? '—' : r !== null ? Number(r).toFixed(2) : '–'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#dcfce7' }} /> Positif kuat</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }} /> Lemah</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#fef2f2' }} /> Negatif kuat</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ═══════════════════════════════════════════
            FEATURE 4 — SHAP Feature Importance
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Kontribusi Fitur (SHAP)
          </h4>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
            Nilai SHAP menunjukkan pengaruh rata-rata setiap fitur terhadap keputusan model Random Forest
          </p>
          <div className="space-y-1.5">
            {SHAP_DATA.map((item) => {
              const pct = Math.max(2, (item.value / SHAP_MAX) * 100);
              const isHigh = item.value >= 0.023;
              return (
                <div key={item.label} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-right text-gray-500 dark:text-gray-400 shrink-0">{item.label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: isHigh ? '#22c55e' : '#60a5fa' }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-600 dark:text-gray-400 font-semibold shrink-0">
                    {item.value.toFixed(4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            AI Chat Interface (unchanged)
            ═══════════════════════════════════════════ */}
        <div className="flex flex-col h-[400px] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50/50 dark:bg-gray-800/20 shadow-inner">
          <div className="bg-primary/5 dark:bg-primary/20 px-4 py-3 border-b border-primary/10 dark:border-primary/30 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} strokeWidth={2} className="text-green-800 dark:text-green-600" />
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
                  {msg.role === 'user' ? <User size={14} strokeWidth={2.5} /> : <Sparkles size={14} />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-sm border-transparent'
                  : 'bg-white dark:bg-gray-800 text-neutral-text dark:text-gray-100 rounded-tl-sm border-gray-100 dark:border-gray-700'
                  }`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={customMarkdown}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent/20 text-primary dark:text-accent flex items-center justify-center flex-shrink-0">
                  <Sparkles size={14} />
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
                {isChatLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisPanel;
