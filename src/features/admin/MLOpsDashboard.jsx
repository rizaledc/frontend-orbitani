import logger from '../../utils/logger';
import { useState, useEffect } from 'react';
import { Cpu, CheckCircle, XCircle, Table, Lightning, Pulse } from '@phosphor-icons/react';
import { Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFeedbackList, submitFeedback, triggerModelTraining, getLLMStatus } from '../../services/mlOpsService';

const MLOpsDashboard = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [llmStatus, setLlmStatus] = useState(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(true);
  const [isLoadingLLM, setIsLoadingLLM] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);

  // Feedback form
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    lahan_id: '',
    actual_n: '',
    actual_p: '',
    actual_k: '',
    rating: 5,
  });

  useEffect(() => {
    fetchFeedback();
    fetchLLMStatus();
  }, []);

  const fetchFeedback = async () => {
    setIsLoadingFeedback(true);
    try {
      const data = await getFeedbackList();
      setFeedbackList(Array.isArray(data) ? data : []);
    } catch (err) {
      logger.error(err);
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const fetchLLMStatus = async () => {
    setIsLoadingLLM(true);
    try {
      const data = await getLLMStatus();
      setLlmStatus(data);
    } catch (err) {
      logger.error(err);
    } finally {
      setIsLoadingLLM(false);
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    const toastId = toast.loading('⚙️ Memproses retraining model, harap tunggu...', { duration: Infinity });
    try {
      const result = await triggerModelTraining();

      toast.success(
        `✅ Retraining selesai! · Akurasi: ${(result.accuracy * 100).toFixed(2)}% · F1-Score: ${(result.f1_score * 100).toFixed(2)}%`,
        { id: toastId, duration: 8000, style: { maxWidth: '480px' } }
      );
    } catch (err) {
      logger.error(err);
      const status = err?.response?.status;
      let errMsg = '❌ Gagal memicu retraining. Silakan coba lagi.';

      if (status === 401) {
        errMsg = '🔒 Sesi Anda telah berakhir. Silakan login kembali.';
      } else if (status === 403) {
        errMsg = '🚫 Akses ditolak. Fitur ini hanya tersedia untuk Admin.';
      } else if (status === 500) {
        const detail = err?.response?.data?.detail;
        errMsg = detail
          ? `⚠️ Server error: ${detail}`
          : '⚠️ Terjadi kesalahan pada server saat melatih model.';
      }

      toast.error(errMsg, {
        id: toastId,
        duration: 7000,
        style: { maxWidth: '480px' },
      });
    } finally {
      setIsRetraining(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await submitFeedback({
        ...feedbackForm,
        actual_n: Number(feedbackForm.actual_n),
        actual_p: Number(feedbackForm.actual_p),
        actual_k: Number(feedbackForm.actual_k),
        rating: Number(feedbackForm.rating),
      });
      toast.success('Ground-truth feedback berhasil dikirimkan.');
      setShowFeedbackForm(false);
      setFeedbackForm({ lahan_id: '', actual_n: '', actual_p: '', actual_k: '', rating: 5 });
      fetchFeedback();
    } catch (err) {
      logger.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ──── Header ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
            <Cpu size={24} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Dashboard MLOps</h1>
            <p className="text-sm text-gray-500 mt-0.5">Monitor, retrain, dan evaluasi model Machine Learning.</p>
          </div>
        </div>
        <button
          onClick={handleRetrain}
          disabled={isRetraining}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRetraining ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <RefreshCw size={16} strokeWidth={2.5} />
          )}
          {isRetraining ? 'Memproses Retraining...' : 'Trigger Retraining'}
        </button>
      </div>

      {/* ──── LLM Status Card ──── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Pulse size={20} className="text-primary" weight="duotone" />
          <h2 className="text-base font-bold text-gray-900">Status Engine AI</h2>
        </div>
        {isLoadingLLM ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : llmStatus ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(llmStatus).map(([key, val]) => (
              <div key={key} className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-start gap-3 overflow-hidden">
                {val !== false && val !== null && val !== undefined && (Array.isArray(val) || typeof val !== 'object' || val?.status === 'online') ? (
                  <CheckCircle size={22} className="text-primary mt-0.5 shrink-0" weight="fill" />
                ) : (
                  <XCircle size={22} className="text-red-500 mt-0.5 shrink-0" weight="fill" />
                )}
                <div className="flex-1 min-w-0 break-all">
                  <p className="text-sm font-bold text-gray-900 capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500 mt-0.5 whitespace-pre-wrap">
                    {Array.isArray(val) 
                      ? val.join(', ') 
                      : typeof val === 'object' 
                        ? (val?.status || JSON.stringify(val)) 
                        : String(val)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Tidak dapat memuat status engine.</p>
        )}
      </div>

      {/* ──── Ground Truth Feedback Table ──── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Table size={20} className="text-primary" weight="duotone" />
            <h2 className="text-base font-bold text-gray-900">Ground Truth & Feedback Log</h2>
          </div>
          <button
            onClick={() => setShowFeedbackForm(!showFeedbackForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-sm"
          >
            <Lightning size={14} weight="bold" />
            {showFeedbackForm ? 'Tutup Form' : 'Tambah Ground Truth'}
          </button>
        </div>

        {/* Inline Feedback Form */}
        {showFeedbackForm && (
          <form onSubmit={handleSubmitFeedback} className="p-6 bg-gray-50 border-b border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Lahan ID</label>
              <input type="text" value={feedbackForm.lahan_id} onChange={(e) => setFeedbackForm({...feedbackForm, lahan_id: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Aktual N</label>
              <input type="number" step="any" value={feedbackForm.actual_n} onChange={(e) => setFeedbackForm({...feedbackForm, actual_n: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Aktual P</label>
              <input type="number" step="any" value={feedbackForm.actual_p} onChange={(e) => setFeedbackForm({...feedbackForm, actual_p: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Aktual K</label>
              <input type="number" step="any" value={feedbackForm.actual_k} onChange={(e) => setFeedbackForm({...feedbackForm, actual_k: e.target.value})}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" required />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-hover transition-colors">
              Kirim
            </button>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Lahan</th>
                <th className="px-6 py-4">N</th>
                <th className="px-6 py-4">P</th>
                <th className="px-6 py-4">K</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoadingFeedback ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, ci) => (
                      <td key={ci} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-16"></div></td>
                    ))}
                  </tr>
                ))
              ) : feedbackList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    <Cpu size={32} className="mx-auto mb-2 opacity-20" />
                    Belum ada data feedback.
                  </td>
                </tr>
              ) : (
                feedbackList.map((fb, idx) => (
                  <tr key={fb.id || idx} className="hover:bg-gray-50/50 transition-colors text-gray-700">
                    <td className="px-6 py-3 font-mono text-xs text-gray-400">{fb.id || idx + 1}</td>
                    <td className="px-6 py-3 font-medium text-gray-900">{fb.lahan_id || '-'}</td>
                    <td className="px-6 py-3">{fb.actual_n ?? '-'}</td>
                    <td className="px-6 py-3">{fb.actual_p ?? '-'}</td>
                    <td className="px-6 py-3">{fb.actual_k ?? '-'}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary-50 text-primary text-xs font-bold border border-primary-100">
                        {fb.rating ?? '-'}/10
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400">{fb.created_at ? new Date(fb.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default MLOpsDashboard;
