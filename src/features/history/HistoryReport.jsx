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

  /**
   * Mapper: Normalisasi key dari backend ke format yang diharapkan tabel UI.
   * Backend mungkin mengirim key berbeda (misal: "phosphorus" vs "fosfor", "potassium" vs "kalium").
   * Fungsi ini memastikan data tetap bisa masuk ke kolom tabel apapun format JSON backend-nya.
   */
  const mapRowData = (raw) => {
    // Ekstraksi data bersarang (jika backend membungkus di satellite_results)
    const source = raw.satellite_results || raw.data || raw;

    // Helper untuk pembulatan angka secara aman
    const formatInt = (val) => val != null && !isNaN(val) ? Math.round(Number(val)) : null;
    const formatFloat = (val) => val != null && !isNaN(val) ? Number(val).toFixed(2) : null;
    
    // Ekstraksi ai_recommendation
    const cropLabel = raw.ai_recommendation || 
                      source.ai_recommendation || 
                      raw.label || 
                      source.label || 
                      raw.predicted_crop || 
                      source.predicted_crop || 
                      raw.tanaman || 
                      null;

    return {
      id: raw.id,
      created_at: raw.created_at || raw.timestamp || raw.date || new Date().toISOString(),
      longitude: raw.longitude ?? source.lon ?? source.lng ?? null,
      latitude: raw.latitude ?? source.lat ?? null,
      
      // Formatting sesuai instruksi
      nitrogen: formatInt(source.nitrogen ?? source.n ?? raw.nitrogen ?? raw.n),
      fosfor: formatInt(source.fosfor ?? source.phosphorus ?? source.p ?? raw.fosfor ?? raw.phosphorus ?? raw.p),
      kalium: formatInt(source.kalium ?? source.potassium ?? source.k ?? raw.kalium ?? raw.potassium ?? raw.k),
      ph: formatFloat(source.ph ?? source.pH ?? raw.ph ?? raw.pH),
      tci: formatFloat(source.tci ?? source.temperature ?? source.temp ?? raw.tci ?? raw.temperature ?? raw.temp),
      ndti: formatFloat(source.ndti ?? source.humidity ?? source.humid ?? raw.ndti ?? raw.humidity ?? raw.humid),
      rainfall: formatFloat(source.rainfall ?? source.rain ?? source.curah_hujan ?? raw.rainfall ?? raw.rain ?? raw.curah_hujan),
      
      label: cropLabel ? String(cropLabel).toUpperCase() : null, // Standarisasi output teks
    };
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // PENTING: Trailing slash WAJIB untuk FastAPI
      const res = await api.get('/api/history/');
      const rawData = res.data?.data || res.data || [];
      setData(Array.isArray(rawData) ? rawData.map(mapRowData) : []);
    } catch (err) {
      // === DEBUG LOG: Lihat detail error di Developer Tools (F12 → Console) ===
      console.error("=== HISTORY API DEBUG ===");
      console.error("Status:", err.response?.status);
      console.error("Status Text:", err.response?.statusText);
      console.error("Response Data:", err.response?.data);
      console.error("Request URL:", err.config?.url);
      console.error("Full Error:", err);
      console.error("========================");

      // Fallback dummy data jika backend belum siap
      if (!err.response || err.response.status === 404 || err.response.status === 500) {
        setData([
          { id: 1, created_at: new Date().toISOString(), longitude: 106.975, latitude: -6.701, nitrogen: 45, fosfor: 20, kalium: 30, ph: 6.5, tci: 28.5, ndti: 0.45, rainfall: 120, label: "Padi" }
        ]);
        toast.error(`Fallback ke Dummy Data — Backend merespons: ${err.response?.status || 'Network Error'}`);
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

  const tableHeaders = ["Tanggal", "Jam", "Long", "Lat", "N", "P", "K", "pH", "Temp (TCI)", "Humid (NDTI)", "Rainfall", "Tanaman"];

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
                    <td className="px-5 py-4 font-medium whitespace-nowrap">{new Date(row.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </td>
                    <td className="px-5 py-4 text-xs font-mono">{row.longitude != null ? Number(row.longitude).toFixed(4) : '-'}</td>
                    <td className="px-5 py-4 text-xs font-mono">{row.latitude != null ? Number(row.latitude).toFixed(4) : '-'}</td>
                    <td className="px-5 py-4 font-medium text-primary dark:text-accent/80">{row.nitrogen ?? '-'}</td>
                    <td className="px-5 py-4 font-medium text-primary dark:text-accent/80">{row.fosfor ?? '-'}</td>
                    <td className="px-5 py-4 font-medium text-primary dark:text-accent/80">{row.kalium ?? '-'}</td>
                    <td className="px-5 py-4 text-orange-600 dark:text-orange-400">{row.ph ?? '-'}</td>
                    <td className="px-5 py-4 text-red-600 dark:text-red-400">{row.tci != null ? `${row.tci}°C` : '-'}</td>
                    <td className="px-5 py-4 text-blue-600 dark:text-blue-400">{row.ndti ?? '-'}</td>
                    <td className="px-5 py-4 text-cyan-600 dark:text-cyan-400">{row.rainfall != null ? `${row.rainfall} mm` : '-'}</td>
                    <td className="px-5 py-4">
                      {row.label ? (
                        <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          {row.label}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-full bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                          BELUM ADA
                        </span>
                      )}
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
