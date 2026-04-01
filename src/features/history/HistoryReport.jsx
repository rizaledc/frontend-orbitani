import { useState, useEffect } from 'react';
import { DownloadSimple, SpinnerGap, HardDrives } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import api from '../../services/api';

const HistoryReport = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/history');
      setData(res.data?.data || res.data || []);
    } catch (err) {
      console.warn("History API Error:", err);
      // Dummy data fallback for UI development if backend is not ready
      if (!err.response || err.response.status === 404) {
        setData([
          { id: 1, created_at: new Date().toISOString(), longitude: 106.975, latitude: -6.701, nitrogen: 45, fosfor: 20, kalium: 30, ph: 6.5, tci: 28.5, ndti: 0.45, rainfall: 120, label: "Padi" }
        ]);
        toast.error("Beralih ke Dummy Data (API /api/history belum siap)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diexport!");
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Historis");
    XLSX.writeFile(wb, `Laporan_Historis_Orbitani.xlsx`);
    toast.success("Berhasil mengekspor ke Excel!");
  };

  const tableHeaders = ["Tanggal", "Long", "Lat", "N", "P", "K", "pH", "Temp (TCI)", "Humid (NDTI)", "Rainfall", "Tanaman"];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto flex flex-col h-full animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-text dark:text-white tracking-tight">Laporan Historis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-sm">
            Tinjau seluruh rekaman dan parameter cek lahan sebelumnya secara permanen.
          </p>
        </div>
        
        <button
          onClick={handleExport}
          disabled={isLoading || data.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent/10 text-accent font-semibold rounded-xl hover:bg-accent hover:text-white transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-accent/20"
        >
          <DownloadSimple size={20} weight="bold" />
          Export ke Excel
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-gray-400">
            <SpinnerGap size={40} className="animate-spin text-primary dark:text-accent mb-4" />
            <p>Memuat rekam jejak satelit...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-gray-400">
            <HardDrives size={60} className="opacity-20 mb-4" weight="duotone" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Belum ada retensi data lahan.</p>
            <p className="text-sm">Data histori prediksi lahan akan otomatis tersimpan di sini.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-primary/5 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  {tableHeaders.map((header) => (
                    <th key={header} className="px-5 py-4 font-semibold tracking-wide">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50 text-gray-700 dark:text-gray-200">
                {data.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-5 py-4">{new Date(row.created_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-5 py-4 text-xs font-mono">{row.longitude?.toFixed(4) || '-'}</td>
                    <td className="px-5 py-4 text-xs font-mono">{row.latitude?.toFixed(4) || '-'}</td>
                    <td className="px-5 py-4 font-medium text-primary dark:text-accent/80">{row.nitrogen ?? '-'}</td>
                    <td className="px-5 py-4 font-medium text-primary dark:text-accent/80">{row.fosfor ?? '-'}</td>
                    <td className="px-5 py-4 font-medium text-primary dark:text-accent/80">{row.kalium ?? '-'}</td>
                    <td className="px-5 py-4 text-orange-600 dark:text-orange-400">{row.ph ?? '-'}</td>
                    <td className="px-5 py-4 text-red-600 dark:text-red-400">{row.tci ?? '-'}°</td>
                    <td className="px-5 py-4 text-blue-600 dark:text-blue-400">{row.ndti ?? '-'}</td>
                    <td className="px-5 py-4 text-cyan-600 dark:text-cyan-400">{row.rainfall ?? '-'} mm</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        {row.label || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryReport;
