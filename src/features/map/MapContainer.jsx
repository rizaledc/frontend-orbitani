import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer as LeafletMap, TileLayer, CircleMarker, Popup, LayersControl, useMap } from 'react-leaflet';
import {
  GlobeHemisphereWest, SpinnerGap,
  CaretUp, CaretDown, CaretLeft, CaretRight,
  MagnifyingGlassPlus, MagnifyingGlassMinus, Crosshair,
  MapPin,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import AnalysisPanel from './AnalysisPanel';
import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const PAN_STEP = 120;
const DEFAULT_CENTER = [-2.5489, 118.0149];
const DEFAULT_ZOOM = 5;

const getColorByTanaman = (tanaman) => {
  const lower = tanaman?.toLowerCase() || '';
  if (lower.includes('kopi')) return '#6F4E37';
  if (lower.includes('mangga')) return '#F59E0B';
  if (lower.includes('padi')) return '#10B981';
  if (lower.includes('jagung')) return '#EAB308';
  return '#2DD4BF';
};

// Normalize field access across backend naming variants
const getSampleField = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] != null) return obj[k];
  return null;
};
const getSampleN = (r) => getSampleField(r, 'N', 'nitrogen', 'n');
const getSampleP = (r) => getSampleField(r, 'P', 'fosfor', 'phosphorus', 'p');
const getSampleK = (r) => getSampleField(r, 'K', 'kalium', 'potassium', 'k');
const getSampleReko = (r) => getSampleField(r, 'rekomendasi', 'recommendation', 'label') ?? '-';
const fmtVal = (v) => v != null ? Number(v).toFixed(1) : '–';

/* ── Inner component that has access to the Leaflet map instance ── */
const MapController = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
};

/* ── D-Pad Navigation Panel ── */
const MapNavigationPanel = ({ mapRef, defaultCenter }) => {
  const pan = useCallback((dx, dy) => {
    mapRef.current?.panBy([dx, dy], { animate: true });
  }, [mapRef]);

  const btnBase =
    'w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary active:scale-95 transition-all shadow-sm disabled:opacity-40';

  return (
    <div
      id="map-nav-panel"
      className="absolute bottom-20 right-4 z-[1000] flex flex-col items-center gap-1 select-none"
      role="group"
      aria-label="Kontrol Navigasi Peta"
    >
      <div className="flex flex-col gap-1 mb-2">
        <button id="map-zoom-in" aria-label="Zoom In" className={btnBase} onClick={() => mapRef.current?.zoomIn()}>
          <MagnifyingGlassPlus size={18} weight="bold" />
        </button>
        <button id="map-zoom-out" aria-label="Zoom Out" className={btnBase} onClick={() => mapRef.current?.zoomOut()}>
          <MagnifyingGlassMinus size={18} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <div />
        <button id="map-pan-up" aria-label="Geser ke Atas" className={btnBase} onClick={() => pan(0, -PAN_STEP)}>
          <CaretUp size={16} weight="bold" />
        </button>
        <div />

        <button id="map-pan-left" aria-label="Geser ke Kiri" className={btnBase} onClick={() => pan(-PAN_STEP, 0)}>
          <CaretLeft size={16} weight="bold" />
        </button>
        <button
          id="map-reset-view" aria-label="Kembali ke Posisi Awal" title="Reset View"
          className={`${btnBase} text-primary`}
          onClick={() => mapRef.current?.setView(defaultCenter, DEFAULT_ZOOM, { animate: true })}
        >
          <Crosshair size={16} weight="bold" />
        </button>
        <button id="map-pan-right" aria-label="Geser ke Kanan" className={btnBase} onClick={() => pan(PAN_STEP, 0)}>
          <CaretRight size={16} weight="bold" />
        </button>

        <div />
        <button id="map-pan-down" aria-label="Geser ke Bawah" className={btnBase} onClick={() => pan(0, PAN_STEP)}>
          <CaretDown size={16} weight="bold" />
        </button>
        <div />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   MAIN MAP COMPONENT
   ══════════════════════════════════════════════ */
const MapContainer = () => {
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSamplePoints, setShowSamplePoints] = useState(true);
  const mapRef = useRef(null);
  const mapWrapperRef = useRef(null);

  // ── Data Fetching — also refreshes selectedPoint so satellite_results stays current ──
  const fetchLahan = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/lahan/');
      const data = response.data?.data || response.data || [];
      const list = Array.isArray(data) ? data : [];
      setPoints(list);
      // Keep selectedPoint in sync so new satellite_results are reflected immediately
      setSelectedPoint((prev) => {
        if (!prev) return null;
        return list.find((p) => p.id === prev.id) ?? prev;
      });
    } catch (err) {
      console.error('Gagal memuat point lahan', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLahan(); }, []);

  // ── Keyboard Navigation ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const wrapper = mapWrapperRef.current;
      if (!wrapper || !wrapper.contains(document.activeElement)) return;
      if (!mapRef.current) return;
      const KEY_MAP = {
        ArrowUp: () => mapRef.current.panBy([0, -PAN_STEP]),
        ArrowDown: () => mapRef.current.panBy([0, PAN_STEP]),
        ArrowLeft: () => mapRef.current.panBy([-PAN_STEP, 0]),
        ArrowRight: () => mapRef.current.panBy([PAN_STEP, 0]),
        '+': () => mapRef.current.zoomIn(),
        '=': () => mapRef.current.zoomIn(),
        '-': () => mapRef.current.zoomOut(),
      };
      if (KEY_MAP[e.key]) { e.preventDefault(); KEY_MAP[e.key](); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Satellite Sync ──
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
      const query = lat !== undefined && lng !== undefined ? `?lat=${lat}&lon=${lng}` : '';
      await api.get(`/lahan/${selectedPoint.id}/data${query}`);
      toast.success('Satelit Landsat tersinkronisasi!', { id: syncToast });
      fetchLahan();
    } catch (err) {
      toast.error('Gagal menyinkronkan data satelit.', { id: syncToast });
    } finally {
      setIsSyncing(false);
    }
  };

  const center = points.length > 0 && points[0].latitude
    ? [points[0].latitude, points[0].longitude]
    : DEFAULT_CENTER;

  const samplePoints = selectedPoint?.satellite_results ?? [];
  const hasSamples = samplePoints.length > 0;

  return (
    <div
      ref={mapWrapperRef}
      tabIndex={0}
      className="relative w-full h-[calc(100vh-64px)] overflow-hidden outline-none focus:ring-2 focus:ring-primary/30"
      aria-label="Peta Eksplorasi Lahan — Gunakan tombol panah keyboard untuk navigasi"
    >
      {/* ── Top Floating Action Bar ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3">
        <button
          onClick={handleSyncSatellite}
          disabled={isSyncing}
          className="flex items-center gap-2 px-6 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md text-primary dark:text-accent font-semibold rounded-full shadow-xl border border-white/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
        >
          {isSyncing ? <SpinnerGap size={20} className="animate-spin" /> : <GlobeHemisphereWest size={20} weight="duotone" />}
          <span>{isSyncing ? 'Menyinkronisasi...' : 'Muat Data Satelit'}</span>
        </button>

        {/* Toggle sample points — only shown when a lahan with satellite_results is selected */}
        {hasSamples && (
          <button
            onClick={() => setShowSamplePoints((v) => !v)}
            className={`flex items-center gap-2 px-4 py-3 backdrop-blur-md font-semibold rounded-full shadow-xl border transition-all hover:scale-105 active:scale-95 ${showSamplePoints
              ? 'bg-[#E24B4A]/90 text-white border-[#E24B4A]/20'
              : 'bg-white/90 text-gray-600 border-white/20'
              }`}
          >
            <MapPin size={18} weight="duotone" />
            <span className="hidden sm:inline">
              {showSamplePoints ? 'Sembunyikan Titik Sampel' : 'Tampilkan Titik Sampel'}
            </span>
            <span className="sm:hidden">{samplePoints.length} Titik</span>
          </button>
        )}
      </div>

      {/* ── Full-screen Loading Overlay ── */}
      {isLoading && points.length === 0 && (
        <div className="absolute inset-0 z-[999] bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center">
          <SpinnerGap size={40} className="text-primary animate-spin" />
        </div>
      )}

      {/* ── D-Pad Navigation Panel ── */}
      <MapNavigationPanel mapRef={mapRef} defaultCenter={center} />

      {/* ── Leaflet Map ── */}
      <LeafletMap center={center} zoom={DEFAULT_ZOOM} className="h-full w-full z-0" zoomControl={false}>
        <MapController mapRef={mapRef} />

        <LayersControl position="bottomleft">
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

        {/* ── Lahan Points ── */}
        {points.map((point) => {
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
              eventHandlers={{ click: () => setSelectedPoint(point) }}
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

        {/* ── Satellite Sample Points (merah) ── */}
        {showSamplePoints && samplePoints.map((pt, idx) => {
          const lat = pt.latitude ?? pt.lat;
          const lng = pt.longitude ?? pt.lon ?? pt.lng;
          if (!lat || !lng) return null;
          const n = getSampleN(pt);
          const p = getSampleP(pt);
          const k = getSampleK(pt);
          const reko = getSampleReko(pt);
          return (
            <CircleMarker
              key={`sample-${idx}`}
              center={[lat, lng]}
              pathOptions={{ fillColor: '#E24B4A', color: '#E24B4A', fillOpacity: 0.9, weight: 1.5 }}
              radius={6}
            >
              <Popup className="rounded-xl">
                <div className="text-xs p-1.5 space-y-1">
                  <p className="font-bold text-gray-700">Titik Sampel #{idx + 1}</p>
                  <p className="text-gray-600">
                    <b>N:</b> {fmtVal(n)} &nbsp;|&nbsp; <b>P:</b> {fmtVal(p)} &nbsp;|&nbsp; <b>K:</b> {fmtVal(k)}
                  </p>
                  <p className="text-green-700 font-semibold">Rekomendasi: {reko}</p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </LeafletMap>

      {/* ── Analysis Panel (Bottom Sheet) ── */}
      <AnalysisPanel data={selectedPoint} onClose={() => setSelectedPoint(null)} />
    </div>
  );
};

export default MapContainer;
