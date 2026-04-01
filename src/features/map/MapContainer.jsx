import { useEffect, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, CircleMarker, Popup, LayersControl } from 'react-leaflet';
import { GlobeHemisphereWest, SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import AnalysisPanel from './AnalysisPanel';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker URLs for any default behaviors
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const getColorByTanaman = (tanaman) => {
  const lower = tanaman?.toLowerCase() || '';
  if (lower.includes('kopi')) return '#6F4E37'; // Coffee Brown
  if (lower.includes('mangga')) return '#F59E0B'; // Mango Amber
  if (lower.includes('padi')) return '#10B981'; // Rice Emerald
  if (lower.includes('jagung')) return '#EAB308'; // Corn Yellow
  return '#2DD4BF'; // Default Accent Teal
};

const MapContainer = () => {
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Data Fetching
  const fetchLahan = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/lahan/');
      const data = response.data?.data || response.data || [];
      setPoints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal memuat point lahan', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLahan();
  }, []);

  // 3. Sync Button Logic
  const handleSyncSatellite = async () => {
    if (!selectedPoint) {
      toast.error('Pilih titik lahan di peta terlebih dahulu!');
      return;
    }
    setIsSyncing(true);
    const syncToast = toast.loading('Satelit sedang memindai... (15-20 detik)', {
      style: { background: '#1c4234', color: '#fff', borderRadius: '12px' },
    });

    try {
      let lat = selectedPoint.latitude;
      let lng = selectedPoint.longitude;
      if (!lat && selectedPoint.koordinat?.[0]) {
        lat = selectedPoint.koordinat[0][1];
        lng = selectedPoint.koordinat[0][0];
      }

      let query = '';
      if (lat !== undefined && lng !== undefined) {
        query = `?lat=${lat}&lon=${lng}`;
      }
      await api.get(`/api/lahan/${selectedPoint.id}/data${query}`); 
      toast.success('Satelit Landsat tersinkronisasi!', { id: syncToast });
      fetchLahan(); 
    } catch (err) {
      toast.error('Gagal menyinkronkan data satelit.', { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  // Default coordinate if no points exist: Indonesia Center
  const center = points.length > 0 && points[0].latitude 
    ? [points[0].latitude, points[0].longitude] 
    : [-2.5489, 118.0149];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden">
      
      {/* Top Floating Action Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3">
        <button
          onClick={handleSyncSatellite}
          disabled={isSyncing}
          className="flex items-center gap-2 px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-primary dark:text-accent font-semibold rounded-full shadow-xl border border-white/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
        >
          {isSyncing ? (
            <SpinnerGap size={20} className="animate-spin" />
          ) : (
            <GlobeHemisphereWest size={20} weight="duotone" />
          )}
          <span>{isSyncing ? 'Menyinkronisasi...' : 'Muat Data Satelit'}</span>
        </button>
      </div>

      {isLoading && points.length === 0 && (
        <div className="absolute inset-0 z-[999] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
          <SpinnerGap size={40} className="text-primary animate-spin" />
        </div>
      )}

      {/* Leaflet Map Integration */}
      <LeafletMap center={center} zoom={5} className="h-full w-full z-0" zoomControl={false}>
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Standard (OSM)">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Landsat / Esri Satellite">
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* 2. Marker Logic (L.circleMarker via CircleMarker component) */}
        {points.map((point) => {
          // If points are stored as Polygon/Coordinates array, we extract centroid.
          // Assuming point has latitude/longitude for this implementation based on typical circleMarker usage.
          // Fallback to extraction if standard polygon coordinates are used.
          let lat = point.latitude;
          let lng = point.longitude;

          if (!lat && point.koordinat?.[0]) {
            lat = point.koordinat[0][1];
            lng = point.koordinat[0][0];
          }

          if (!lat || !lng) return null;

          const color = getColorByTanaman(point.jenis_tanaman);

          return (
            <CircleMarker
              key={point.id}
              center={[lat, lng]}
              pathOptions={{ fillColor: color, color: color, fillOpacity: 0.7, weight: 2 }}
              radius={8}
              eventHandlers={{
                click: () => {
                  setSelectedPoint(point); // 4. Interaction: set data for Bottom Sheet
                },
              }}
            >
              <Popup className="rounded-xl">
                <div className="text-center p-1">
                  <p className="font-bold text-primary">{point.nama || `Titik #${point.id}`}</p>
                  <p className="text-xs text-gray-500 capitalize">{point.jenis_tanaman || 'Unknown'}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </LeafletMap>

      {/* 4. Bottom Sheet (Analysis Panel with Chat) */}
      <AnalysisPanel data={selectedPoint} onClose={() => setSelectedPoint(null)} />
    </div>
  );
};

export default MapContainer;
