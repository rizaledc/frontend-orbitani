import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { SpinnerGap, ChartLineUp, WarningCircle } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ChartCard = ({ title, dataKey, data, color, yAxisLabel }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700">
    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">{title}</h3>
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.15} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            dy={10} 
            minTickGap={30}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#6B7280' }} 
            dx={-10}
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#1F2937', color: '#FFF' }}
            itemStyle={{ color: '#FFF' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
          <Line 
            type="monotone" 
            dataKey={dataKey} 
            name={title}
            stroke={color} 
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: color }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const AnalyticsDashboard = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/lahan/analytics');
      setData(res.data?.data || res.data || []);
    } catch (err) {
      console.warn("Analytics API Error:", err);
      // Fallback data if backend is not ready
      if (!err.response || err.response.status === 404) {
        const dummyData = Array.from({ length: 10 }).map((_, i) => ({
          date: `Mar ${i + 1}`,
          nitrogen: 40 + Math.random() * 10,
          fosfor: 15 + Math.random() * 5,
          kalium: 25 + Math.random() * 8,
          ph: 6 + Math.random() * 1.5,
          tci: 26 + Math.random() * 4,
          ndti: 0.3 + Math.random() * 0.2,
          rainfall: 80 + Math.random() * 50
        }));
        setData(dummyData);
        toast.error("Menggunakan Dummy Data (API /api/lahan/analytics belum siap)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-text dark:text-white tracking-tight flex items-center gap-3">
          <ChartLineUp size={32} className="text-primary dark:text-accent" weight="duotone" />
          Laporan Analitik Tren Lahan
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl text-sm leading-relaxed">
          Grafik di bawah merupakan agregasi dari ~200 titik sampel acak berdasarkan area poligon lahan untuk memonitor tren kandungan nutrisi dan iklim dari waktu ke waktu.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <SpinnerGap size={40} className="animate-spin text-primary dark:text-accent" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 p-6 rounded-2xl flex items-center gap-3 border border-orange-100 dark:border-orange-500/20">
          <WarningCircle size={24} weight="fill" />
          <p className="font-medium">Belum ada data analitik yang dapat ditampilkan. Lakukan sinkronisasi lahan terlebih dahulu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ChartCard title="Kadar Nitrogen (N)" dataKey="nitrogen" data={data} color="#10B981" yAxisLabel="mg/kg" />
          <ChartCard title="Kadar Fosfor (P)" dataKey="fosfor" data={data} color="#06B6D4" yAxisLabel="mg/kg" />
          <ChartCard title="Kadar Kalium (K)" dataKey="kalium" data={data} color="#8B5CF6" yAxisLabel="mg/kg" />
          
          <ChartCard title="Tingkat pH Tanah" dataKey="ph" data={data} color="#F59E0B" yAxisLabel="pH Score" />
          <ChartCard title="Temperature Condition Index (TCI)" dataKey="tci" data={data} color="#EF4444" yAxisLabel="°C Degree" />
          <ChartCard title="Normalized Difference Tillage Index (NDTI)" dataKey="ndti" data={data} color="#3B82F6" yAxisLabel="Index Value" />
          
          <div className="md:col-span-2 lg:col-span-3">
             <ChartCard title="Tren Curah Hujan (Rainfall)" dataKey="rainfall" data={data} color="#0EA5E9" yAxisLabel="mm" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
