import { X, Droplet, Thermometer, Leaf, Hash } from '@phosphor-icons/react';

const DataPanel = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white dark:bg-gray-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transform transition-transform duration-300 ease-out border-t border-gray-100 dark:border-gray-700 animate-slide-up">
      {/* Handle / Drag indicator */}
      <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose} style={{ cursor: 'pointer' }}>
        <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
      </div>

      <div className="p-5 md:p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-neutral-text dark:text-white flex items-center gap-2">

              {data.nama || `Lahan #${data.id}`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
              Tanaman: {data.jenis_tanaman || 'Tidak diketahui'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* NPK */}
          <div className="bg-primary/5 dark:bg-accent/10 p-4 rounded-2xl border border-primary/10 dark:border-accent/20">
            <div className="flex items-center gap-2 text-primary dark:text-accent font-semibold mb-2 text-sm">
              <Hash size={18} weight="bold" /> NPK
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p>N: <span className="font-bold">{data.nitrogen ?? '-'}</span> mg/kg</p>
              <p>P: <span className="font-bold">{data.fosfor ?? '-'}</span> mg/kg</p>
              <p>K: <span className="font-bold">{data.kalium ?? '-'}</span> mg/kg</p>
            </div>
          </div>

          {/* pH Tanah */}
          <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-500/20">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-semibold mb-2 text-sm">
              <Droplet size={18} weight="bold" /> pH Tanah
            </div>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
              {data.ph ?? '-'}
            </p>
          </div>

          {/* Suhu */}
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-500/20">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-2 text-sm">
              <Thermometer size={18} weight="bold" /> Suhu
            </div>
            <p className="text-2xl font-bold text-red-700 dark:text-red-300">
              {data.suhu ? `${data.suhu}°C` : '-'}
            </p>
          </div>

          {/* Kelembapan */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2 text-sm">
              <Droplet size={18} weight="fill" /> Kelembapan
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {data.kelembapan ? `${data.kelembapan}%` : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPanel;
