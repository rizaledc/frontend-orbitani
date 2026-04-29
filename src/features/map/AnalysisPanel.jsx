import { useState, useRef, useEffect } from 'react';
import {
  X, Hash, Thermometer, Drop, CloudRain,
  PaperPlaneRight, Sparkle, User, SpinnerGap, Leaf,
  Plant, ArrowClockwise
} from '@phosphor-icons/react';
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
const getLat = (r) => Array.isArray(r) ? r[1] : r?.lat ?? null;
const getLon = (r) => Array.isArray(r) ? r[0] : r?.lon ?? r?.lng ?? null;
const getRain = (r) => r?.rainfall ?? r?.rain ?? r?.curah_hujan ?? null;
const getReko = (r) => r?.rekomendasi ?? r?.recommendation ?? r?.label ?? '-';
const fmt = (v, d = 1) => v != null ? Number(v).toFixed(d) : '–';

const calcStats = (arr, getter) => {
  const vals = arr.map(getter).filter((v) => v != null);
  if (!vals.length) return null;
  const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
  const std = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
  return { min: Math.min(...vals), max: Math.max(...vals), mean, std };
};

// ── Feature 5: Status badge helpers ──
const getNBadge = (v) => {
  if (v == null) return null;
  if (v < 20) return { label: 'Sangat Rendah', cls: 'bg-red-100 text-red-700' };
  if (v < 50) return { label: 'Rendah', cls: 'bg-orange-100 text-orange-700' };
  if (v < 100) return { label: 'Sedang', cls: 'bg-lime-100 text-lime-700' };
  return { label: 'Tinggi', cls: 'bg-green-100 text-green-700' };
};
const getPHBadge = (v) => {
  if (v == null) return null;
  if (v < 5.5) return { label: 'Sangat Asam', cls: 'bg-red-100 text-red-700' };
  if (v < 6.5) return { label: 'Optimal', cls: 'bg-green-100 text-green-700' };
  if (v < 7.5) return { label: 'Netral', cls: 'bg-blue-100 text-blue-700' };
  return { label: 'Basa', cls: 'bg-purple-100 text-purple-700' };
};
const getHumidBadge = (v) => {
  if (v == null) return null;
  if (v < 60) return { label: 'Kering', cls: 'bg-yellow-100 text-yellow-700' };
  if (v < 80) return { label: 'Normal', cls: 'bg-green-100 text-green-700' };
  return { label: 'Tinggi', cls: 'bg-blue-100 text-blue-700' };
};
const getTempBadge = (v) => {
  if (v == null) return null;
  if (v < 20) return { label: 'Dingin', cls: 'bg-blue-100 text-blue-700' };
  if (v < 30) return { label: 'Optimal', cls: 'bg-green-100 text-green-700' };
  return { label: 'Panas', cls: 'bg-red-100 text-red-700' };
};

const Badge = ({ badge }) =>
  badge
    ? <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
    : null;

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

/** Format ISO timestamp → "27 Apr 2026, 13:00" */
const formatDate = (isoString) => {
  if (!isoString) return '-';
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  } catch {
    return isoString;
  }
};

const AnalysisPanel = ({ data, lahanDetail, lahanBiofisik, samplePoints, onClose, onAnalyze, isAnalyzing }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Saya Pakar Agronomi AI. Ada yang ingin dianalisis tentang titik lahan ini?' }
  ]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [detailLahan, setDetailLahan] = useState(null);
  const [samples, setSamples] = useState([]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!data?.id) return;
    const fetchSamples = async () => {
      try {
        const res = await api.get(`/lahan/${data.id}/data`);
        console.log('RAW RESPONSE:', JSON.stringify(res.data));
        const result = res.data;
        const points = result?.satellite_results || result?.data || [];
        console.log('POINTS:', points.length, points[0]);
        setSamples(Array.isArray(points) ? points : []);
      } catch (err) {
        setSamples([]);
      }
    };
    fetchSamples();
  }, [data?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  useEffect(() => {
    if (data) {
      setMessages([{ role: 'assistant', content: `Halo! Mari bahas lahan **${data.nama || `Titik #${data.id}`}**. Tanyakan apapun soal kondisi tanah atau iklimnya.` }]);

      setDetailLahan(null);
      getLahanData(data.id)
        .then(res => setDetailLahan(res))
        .catch(err => console.error("Gagal memuat detail:", err));
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
    setMessages((prev) => [...prev, { role: 'user', content: '🛰️ Minta analisis mendalam lahan ini...' }]);
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
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="text-lg font-bold text-neutral-text dark:text-white flex items-center gap-2">
            {data.nama || `Lahan #${data.id}`}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 capitalize bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded-full">
            {data.jenis_tanaman || 'Unknown Crop'}
          </p>
        </div>
        <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
          <X size={20} weight="bold" className="text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* ─── Scrollable Content ─── */}
      <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">

        {/* ── AI Analyze Button ── */}
        {onAnalyze && (() => {
          const recos = getRecos(data);
          const hasResult = recos.length > 0;
          return (
            <button
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isAnalyzing ? (
                <><OrbitaniLoader size="sm" /><span>Menganalisis Lahan...</span></>
              ) : (
                <>
                  {hasResult ? <ArrowClockwise size={16} weight="bold" /> : <Plant size={16} weight="duotone" />}
                  <span>{hasResult ? 'Analisis Ulang / Perbarui' : 'Analisis Tanaman (AI)'}</span>
                </>
              )}
            </button>
          );
        })()}

        {/* ── Rekomendasi Tanaman AI ── */}
        {(() => {
          const recos = getRecos(data);
          if (recos.length === 0) return null;
          return (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/40 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <Plant size={14} weight="duotone" /> Rekomendasi Tanaman AI
                </span>
                <span className="text-[10px] text-gray-400">{formatDate(data.terakhir_dianalisis)}</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {recos.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{item.tanaman}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">{item.persentase}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════
            FEATURE 5 — Kondisi Biofisik Lahan
            with status badges on each metric
            ═══════════════════════════════════════════ */}
        <div>
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Hash size={16} className="text-secondary" /> Kondisi Biofisik Lahan
            </h4>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 ml-6">Rata-rata 10 titik sampel satelit</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* NPK Block */}
            <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-gray-800 dark:to-gray-800 p-4 rounded-2xl border border-primary/10 dark:border-gray-700">
              <span className="text-xs font-bold text-primary dark:text-accent mb-2 block">Kandungan NPK</span>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Nitrogen</span>
                <span className="font-semibold text-neutral-text dark:text-gray-200 flex items-center">
                  {bioN != null ? Number(bioN).toFixed(1) : '-'} <span className="text-[10px] font-normal text-gray-400 ml-1">mg/kg</span>
                  <Badge badge={getNBadge(bioN)} />
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Fosfor</span>
                <span className="font-semibold text-neutral-text dark:text-gray-200">
                  {bioP != null ? Number(bioP).toFixed(1) : '-'} <span className="text-[10px] font-normal text-gray-400">mg/kg</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-600 dark:text-gray-400">Kalium</span>
                <span className="font-semibold text-neutral-text dark:text-gray-200">
                  {bioK != null ? Number(bioK).toFixed(1) : '-'} <span className="text-[10px] font-normal text-gray-400">mg/kg</span>
                </span>
              </div>
            </div>

            {/* Climate Block */}
            <div className="col-span-2 sm:col-span-1 grid grid-cols-2 gap-2">
              <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1 mb-1">
                  <Thermometer size={14} /> pH
                </span>
                <span className="text-lg font-bold text-orange-700 dark:text-orange-300">{bioPH != null ? Number(bioPH).toFixed(2) : '-'}</span>
                <Badge badge={getPHBadge(bioPH)} />
              </div>
              <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border border-red-100 dark:border-red-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 flex items-center gap-1 mb-1">
                  <Thermometer size={14} /> Suhu
                </span>
                <span className="text-lg font-bold text-red-700 dark:text-red-300">{bioSuhu != null ? `${Number(bioSuhu).toFixed(1)}°C` : '-'}</span>
                <Badge badge={getTempBadge(bioSuhu)} />
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-1">
                  <Drop size={14} /> Lembab
                </span>
                <span className="text-lg font-bold text-blue-700 dark:text-blue-300">{bioLembab != null ? `${Number(bioLembab).toFixed(1)}%` : '-'}</span>
                <Badge badge={getHumidBadge(bioLembab)} />
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-900/10 p-3 rounded-2xl border border-cyan-100 dark:border-cyan-500/20 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mb-1">
                  <CloudRain size={14} /> Curah Hujan
                </span>
                <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{bioHujan != null ? `${Number(bioHujan).toFixed(1)} mm` : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            FEATURE 2 — Data Per Titik Sampel
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Leaf size={16} className="text-emerald-500" /> Data Per Titik Sampel
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
            FEATURE 3 — Distribusi Nilai N per Titik
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <Hash size={16} className="text-blue-500" /> Distribusi Nitrogen (N) per Titik
          </h4>
          {finalSamples.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              Data distribusi belum tersedia. Lakukan analisis ulang.
            </p>
          ) : !nStats ? null : (
            <>
              <div className="space-y-1.5">
                {finalSamples.map((pt, idx) => {
                  const val = getN(pt);
                const pct = val != null ? Math.max(2, (val / nMax) * 100) : 0;
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-right text-gray-400 font-mono shrink-0">{idx + 1}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: '#378ADD' }}
                      />
                    </div>
                    <span className="w-10 text-right text-gray-600 dark:text-gray-400 font-semibold shrink-0">
                      {fmt(val)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
              <span>Min <b className="text-gray-700 dark:text-gray-300">{fmt(nStats.min)}</b></span>
              <span>Mean <b className="text-gray-700 dark:text-gray-300">{fmt(nStats.mean)}</b></span>
              <span>Max <b className="text-gray-700 dark:text-gray-300">{fmt(nStats.max)}</b></span>
              <span>Std <b className="text-gray-700 dark:text-gray-300">{fmt(nStats.std)}</b></span>
            </div>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            FEATURE 4 — SHAP Feature Importance
            ═══════════════════════════════════════════ */}
        <div>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
            <Sparkle size={16} weight="fill" className="text-amber-500" /> Kontribusi Fitur (SHAP)
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
              <Sparkle size={22} weight="fill" className="text-primary dark:text-accent" />
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
                  {msg.role === 'user' ? <User size={14} weight="bold" /> : <Sparkle size={14} weight="fill" />}
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
                  <Sparkle size={14} weight="fill" />
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
