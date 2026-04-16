import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { Plus, X, MagnifyingGlass, Farm, ChartLineUp, CloudSun, Polygon, List, CaretLeft, Check,
  CaretUp, CaretDown, CaretRight, MagnifyingGlassPlus, MagnifyingGlassMinus, Crosshair,
  PencilSimple, Trash
} from '@phosphor-icons/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { getAllLahan, createLahan, getLahanData, getLahanAnalytics, deleteLahan, updateLahan } from '../../services/lahanService';

const DrawControl = ({ isDrawingMode, setIsDrawingMode, onPolygonDrawn }) => {
  const map = useMap();

  useEffect(() => {
    let polygonDrawer;
    if (isDrawingMode) {
      polygonDrawer = new L.Draw.Polygon(map, {
        shapeOptions: {
          color: '#1c4234',
          fillColor: '#2ecc71',
          fillOpacity: 0.3,
          weight: 2,
        },
      });
      polygonDrawer.enable();
      window.__l_draw_polygon = polygonDrawer;
    }

    const onDrawCreated = (e) => {
      setIsDrawingMode(false);
      const geojson = e.layer.toGeoJSON();

      // STRICT VALIDATION: Ensure polygon closure
      let coords = geojson.geometry.coordinates[0];
      const first = coords[0];
      const last = coords[coords.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        coords.push([...first]);
      }
      geojson.geometry.coordinates[0] = coords;

      onPolygonDrawn(geojson);
    };

    map.on(L.Draw.Event.CREATED, onDrawCreated);

    return () => {
      if (polygonDrawer) polygonDrawer.disable();
      map.off(L.Draw.Event.CREATED, onDrawCreated);
      delete window.__l_draw_polygon;
    };
  }, [map, isDrawingMode, setIsDrawingMode, onPolygonDrawn]);

  return null;
};

// --- Bridge: capture Leaflet map instance into external ref ---
const MapNavRef = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => { mapRef.current = map; }, [map, mapRef]);
  return null;
};

// --- D-Pad Navigation Panel (Collapsible, 50% Transparent) ---
const PAN_STEP = 120;
const MapNavigationPanel = ({ mapRef, defaultCenter }) => {
  const [isOpen, setIsOpen] = useState(false);

  const pan = useCallback((dx, dy) => {
    mapRef.current?.panBy([dx, dy], { animate: true });
  }, [mapRef]);

  const btn = 'w-9 h-9 flex items-center justify-center rounded-xl border border-white/40 bg-white/60 text-gray-700 hover:bg-white/80 hover:text-primary active:scale-95 transition-all shadow-sm backdrop-blur-sm';

  return (
    <div
      id="map-nav-panel"
      className="absolute bottom-24 right-6 md:right-8 z-[1000] flex flex-col items-end gap-1 select-none hidden sm:flex"
    >
      {/* Toggle Button — always visible */}
      <button
        id="map-nav-toggle"
        onClick={() => setIsOpen((v) => !v)}
        title={isOpen ? 'Sembunyikan Kontrol' : 'Tampilkan Kontrol Navigasi'}
        aria-expanded={isOpen}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/40 bg-white/50 text-gray-600 hover:bg-white/70 hover:text-primary active:scale-95 transition-all shadow-sm backdrop-blur-sm"
      >
        <Crosshair size={18} weight="bold" className={`transition-transform duration-200 ${isOpen ? 'text-primary rotate-45' : ''}`} />
      </button>

      {/* Collapsible Controls */}
      <div
        className={`flex flex-col items-center gap-1 transition-all duration-200 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none h-0 overflow-hidden'
        }`}
        role="group"
        aria-label="Kontrol Navigasi Peta"
      >
        {/* Zoom */}
        <div className="flex flex-col gap-1 mb-1">
          <button id="map-zoom-in" aria-label="Zoom In" className={btn} onClick={() => mapRef.current?.zoomIn()}>
            <MagnifyingGlassPlus size={18} weight="bold" />
          </button>
          <button id="map-zoom-out" aria-label="Zoom Out" className={btn} onClick={() => mapRef.current?.zoomOut()}>
            <MagnifyingGlassMinus size={18} weight="bold" />
          </button>
        </div>

        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button id="map-pan-up" aria-label="Geser Atas" className={btn} onClick={() => pan(0, -PAN_STEP)}>
            <CaretUp size={16} weight="bold" />
          </button>
          <div />

          <button id="map-pan-left" aria-label="Geser Kiri" className={btn} onClick={() => pan(-PAN_STEP, 0)}>
            <CaretLeft size={16} weight="bold" />
          </button>
          <button
            id="map-reset-view" aria-label="Reset View" title="Kembali ke posisi awal"
            className={`${btn} text-primary`}
            onClick={() => mapRef.current?.setView(defaultCenter, 5, { animate: true })}
          >
            <Crosshair size={14} weight="bold" />
          </button>
          <button id="map-pan-right" aria-label="Geser Kanan" className={btn} onClick={() => pan(PAN_STEP, 0)}>
            <CaretRight size={16} weight="bold" />
          </button>

          <div />
          <button id="map-pan-down" aria-label="Geser Bawah" className={btn} onClick={() => pan(0, PAN_STEP)}>
            <CaretDown size={16} weight="bold" />
          </button>
          <div />
        </div>
      </div>
    </div>
  );
};


// --- Map FlyTo Controller ---
const MapController = ({ selectedGeoJson }) => {
  const map = useMap();
  useEffect(() => {
    if (selectedGeoJson) {
      try {
        const bounds = L.geoJSON(selectedGeoJson).getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
        }
      } catch (err) {
        console.error("Bounds error", err);
      }
    }
  }, [selectedGeoJson, map]);
  return null;
};

const MapDashboard = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'user';
  const canDraw = true;

  const mapRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const DEFAULT_CENTER = [-2.5, 118.0];

  const [lahanList, setLahanList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UX States
  const [isListMinimized, setIsListMinimized] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Map & Drawing
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [drawnGeoJson, setDrawnGeoJson] = useState(null);
  const [formData, setFormData] = useState({ nama: '', keterangan: '' });
  const [editTarget, setEditTarget] = useState(null); // lahan being edited (null = create mode)

  // States for Slide-over
  const [selectedLahan, setSelectedLahan] = useState(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [lahanDetail, setLahanDetail] = useState(null);

  useEffect(() => {
    fetchLahan();
    fetchAnalyticsData();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const wrapper = mapWrapperRef.current;
      if (!wrapper || !wrapper.contains(document.activeElement)) return;
      if (!mapRef.current) return;
      const KEY_MAP = {
        ArrowUp:    () => mapRef.current.panBy([0, -120]),
        ArrowDown:  () => mapRef.current.panBy([0, 120]),
        ArrowLeft:  () => mapRef.current.panBy([-120, 0]),
        ArrowRight: () => mapRef.current.panBy([120, 0]),
        '+': () => mapRef.current.zoomIn(),
        '=': () => mapRef.current.zoomIn(),
        '-': () => mapRef.current.zoomOut(),
      };
      if (KEY_MAP[e.key]) { e.preventDefault(); KEY_MAP[e.key](); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchLahan = async () => {
    try {
      const data = await getAllLahan();
      setLahanList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const data = await getLahanAnalytics();
      setAnalyticsData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePolygonDrawn = (geojson) => {
    setDrawnGeoJson(geojson);
    setShowSaveModal(true);
  };

  // ── Create or Update Lahan ──
  const submitLahan = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim()) {
      toast.error('Nama lahan wajib diisi.');
      return;
    }

    try {
      if (editTarget) {
        // PUT — update existing
        await updateLahan(editTarget.id, {
          nama: formData.nama,
          keterangan: formData.keterangan,
        });
        toast.success('Lahan berhasil diperbarui.');
      } else {
        // POST — create new (koordinat dari GeoJSON yang digambar)
        if (!drawnGeoJson) { toast.error('Gambar poligon terlebih dahulu.'); return; }
        await createLahan({
          nama: formData.nama,
          keterangan: formData.keterangan,
          koordinat: drawnGeoJson.geometry?.coordinates,
        });
        toast.success('Lahan berhasil disimpan.');
      }
      closeModals();
      fetchLahan();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d) => d.msg || d.message).join('; ')
        : (typeof detail === 'string' ? detail : 'Gagal menyimpan lahan.');
      toast.error(msg);
    }
  };

  // ── Delete with Optimistic UI ──
  const handleDeleteLahan = async (e, lahan) => {
    e.stopPropagation();
    if (!window.confirm(`Hapus lahan "${lahan.name || lahan.nama}"?`)) return;
    // Optimistic remove
    setLahanList((prev) => prev.filter((l) => l.id !== lahan.id));
    if (selectedLahan?.id === lahan.id) setIsSlideOpen(false);
    try {
      await deleteLahan(lahan.id);
      toast.success('Lahan berhasil dihapus.');
    } catch (err) {
      // Rollback on failure
      toast.error('Gagal menghapus lahan. Halaman akan di-refresh.');
      fetchLahan();
    }
  };

  // ── Edit: prefill form & open modal ──
  const handleEditLahan = (e, lahan) => {
    e.stopPropagation();
    setEditTarget(lahan);
    setFormData({ nama: lahan.name || lahan.nama || '', keterangan: lahan.description || lahan.keterangan || '' });
    setDrawnGeoJson(null);
    setShowSaveModal(true);
  };

  const handleLahanClick = async (lahan) => {
    setSelectedLahan(lahan);
    setIsSlideOpen(true);
    setIsDataLoading(true);
    // On mobile, minimize list automatically when selecting so map + slideover are visible
    if (window.innerWidth < 768) {
      setIsListMinimized(true);
    }
    try {
      const detail = await getLahanData(lahan.id);
      setLahanDetail(detail);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDataLoading(false);
    }
  };

  const closeModals = () => {
    setShowSaveModal(false);
    setDrawnGeoJson(null);
    setIsDrawingMode(false);
    setEditTarget(null);
    setFormData({ nama: '', keterangan: '' });
  };

  const filteredLahan = lahanList.filter(l => 
    l.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Bounding box: Sabang → Merauke
  const indonesiaBounds = [[-11.0, 94.0], [6.0, 141.0]];

  return (
    <div
      ref={mapWrapperRef}
      tabIndex={0}
      className="relative h-full w-full bg-gray-900 overflow-hidden outline-none"
      aria-label="Peta Eksplorasi Lahan"
    >
      
      {/* ─── KANVAS PETA FULLSCREEN ─── */}
      <MapContainer
        center={[-2.5, 118.0]}
        zoom={5}
        minZoom={5}
        maxBounds={indonesiaBounds}
        maxBoundsViscosity={1.0}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <LayersControl position="topright">
          {/* Layer 1: Satelit (Default) */}
          <LayersControl.BaseLayer checked name="Satelit Global">
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
            />
          </LayersControl.BaseLayer>

          {/* Layer 2: OSMnx */}
          <LayersControl.BaseLayer name="OSMnx">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {canDraw && (
          <DrawControl
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}
            onPolygonDrawn={handlePolygonDrawn}
          />
        )}

        <MapNavRef mapRef={mapRef} />
        <MapController selectedGeoJson={selectedLahan?.geojson} />

        {lahanList.map((lahan) => {
          if (!lahan.geojson) return null;
          return (
            <GeoJSON
              key={lahan.id}
              data={lahan.geojson}
              pathOptions={{
                fillColor: '#2ecc71',
                color: '#1c4234',
                fillOpacity: 0.3,
                weight: 2,
              }}
              eventHandlers={{
                click: () => handleLahanClick(lahan)
              }}
            />
          );
        })}
      </MapContainer>

      {/* ─── D-PAD NAVIGATION PANEL ─── */}
      <MapNavigationPanel mapRef={mapRef} defaultCenter={DEFAULT_CENTER} />

      {/* ─── FLOATING ACTION BUTTON (Draw Mode) ─── */}
      {canDraw && (
        <div className="absolute bottom-6 right-6 md:right-8 z-[1000] flex items-center gap-3">
          {isDrawingMode ? (
            <>
              {/* Selesai / Simpan Button */}
              <button
                onClick={() => {
                  if (window.__l_draw_polygon) {
                    window.__l_draw_polygon.completeShape();
                  }
                }}
                className="w-[56px] h-[56px] bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border border-primary-200 hover:bg-primary-hover active:scale-90 transition-all"
                title="Selesai & Simpan Poligon"
              >
                <Check size={24} weight="bold" /> 
              </button>

              {/* Batal Button */}
              <button
                onClick={() => setIsDrawingMode(false)}
                className="w-[56px] h-[56px] bg-white text-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10 border border-red-200 active:scale-90 transition-all hover:bg-red-50"
                title="Batal Menggambar"
              >
                <X size={24} weight="bold" />
              </button>
            </>
          ) : (
            /* Tambah Lahan Button */
            <button
              onClick={() => {
                setIsDrawingMode(true);
                setIsListMinimized(true); // Auto-hide map list so map is visible for drawing
              }}
              className="w-[56px] h-[56px] bg-white text-primary border-gray-100 hover:bg-gray-50 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 border"
              title="Tambah Lahan Polygon"
            >
              <Polygon size={24} weight="duotone" />
            </button>
          )}
        </div>
      )}

      {/* Draw Instruction Toast */}
      {isDrawingMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[9999] bg-white px-5 py-3 rounded-2xl shadow-md border border-primary-200 text-sm font-semibold text-gray-800 flex items-center gap-3 animate-fade-in pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          Silakan klik pada peta untuk mulai menggambar.
        </div>
      )}

      {/* ─── FLOATING PANEL LIST LAHAN (KIRI ATAS) ─── */}
      <div 
        className={`absolute top-4 md:top-6 left-4 md:left-6 z-[1000] bg-white rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 overflow-hidden flex flex-col ${
          isListMinimized ? 'w-[56px] h-[56px]' : 'w-[320px] h-[65vh] md:h-[75vh]'
        }`}
      >
        {isListMinimized ? (
          <button 
            onClick={() => setIsListMinimized(false)}
            className="w-full h-full flex items-center justify-center text-gray-700 hover:text-primary transition-colors hover:bg-gray-50"
            title="Buka Daftar Lahan"
          >
            <List size={24} weight="bold" />
          </button>
        ) : (
          <>
            <div className="p-4 border-b border-gray-100 bg-white flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List size={20} className="text-primary" weight="bold" />
                  <h2 className="text-base font-bold text-gray-900 tracking-tight">Daftar Lahan</h2>
                </div>
                <button 
                  onClick={() => setIsListMinimized(true)} 
                  className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <CaretLeft size={16} weight="bold" />
                </button>
              </div>
              
              <div className="relative">
                <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari lahan..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-white">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="m-2 h-16 rounded-xl border border-gray-100 skeleton-shimmer" />
                ))
              ) : filteredLahan.length === 0 ? (
                <div className="text-center p-8 text-gray-400">
                  <Farm size={32} className="mx-auto mb-2 opacity-50" weight="duotone" />
                  <p className="text-xs font-semibold">Tidak ada lahan ditemukan.</p>
                </div>
              ) : (
                filteredLahan.map((lahan) => (
                  <div
                    key={lahan.id}
                    onClick={() => handleLahanClick(lahan)}
                    className={`m-1 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedLahan?.id === lahan.id
                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                        : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Farm size={20} className={selectedLahan?.id === lahan.id ? 'text-primary' : 'text-gray-600'} weight="duotone" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-900 text-sm truncate">{lahan.name || lahan.nama}</h3>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{lahan.description || lahan.keterangan || '-'}</p>
                      </div>
                      {/* Action icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleEditLahan(e, lahan)}
                          title="Edit Lahan"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-50 transition-colors"
                        >
                          <PencilSimple size={14} weight="bold" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteLahan(e, lahan)}
                          title="Hapus Lahan"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── SLIDE-OVER ANALITIK KANAN ─── */}
      <div
        className={`absolute top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl border-l border-gray-100 z-[1010] transform transition-transform duration-300 ease-in-out ${
          isSlideOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col bg-white">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{selectedLahan?.name || 'Detail Lahan'}</h2>
              <span className="text-xs text-gray-500 font-mono">ID: {selectedLahan?.id}</span>
            </div>
            <button
              onClick={() => setIsSlideOpen(false)}
              className="p-2 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
            {isDataLoading ? (
              <div className="space-y-6">
                <div className="h-32 rounded-xl skeleton-shimmer" />
                <div className="space-y-2">
                  <div className="h-4 w-1/3 rounded skeleton-shimmer" />
                  <div className="h-48 rounded-xl skeleton-shimmer" />
                </div>
              </div>
            ) : (
              <>
                {/* Meta data */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Luas Poligon</p>
                    <p className="text-sm font-bold text-gray-900">{Math.floor(Math.random() * 50) + 10} Hektar</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-1">Status Satelit</p>
                    <p className="text-sm font-bold text-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Resolusi Tinggi
                    </p>
                  </div>
                </div>

                {/* Chart 1: NPK Trends */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <ChartLineUp size={18} className="text-primary" weight="duotone" />
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">Tren Kesuburan (NPK)</h3>
                  </div>
                  <div className="w-full h-[200px]">
                    {isSlideOpen && (
                      <ResponsiveContainer width="100%" height={200} minWidth={1}>
                        <LineChart data={analyticsData.length ? analyticsData : [{ day: 'Sen', n: 40, p: 20, k: 30 }, { day: 'Sel', n: 42, p: 21, k: 32 }, { day: 'Rab', n: 45, p: 25, k: 30 }, { day: 'Kam', n: 48, p: 28, k: 35 }]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                          <Line type="monotone" dataKey="n" name="N" stroke="#1c4234" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="p" name="P" stroke="#2ecc71" strokeWidth={3} dot={false} />
                          <Line type="monotone" dataKey="k" name="K" stroke="#f59e0b" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Chart 2: Weather */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 mb-5">
                    <CloudSun size={18} className="text-blue-500" weight="duotone" />
                    <h3 className="text-sm font-bold text-gray-900 tracking-tight">Prediksi Curah Hujan</h3>
                  </div>
                  <div className="w-full h-[200px]">
                    {isSlideOpen && (
                      <ResponsiveContainer width="100%" height={200} minWidth={1}>
                        <LineChart data={[{ day: 'Sen', mm: 12 }, { day: 'Sel', mm: 5 }, { day: 'Rab', mm: 0 }, { day: 'Kam', mm: 35 }, { day: 'Jum', mm: 20 }]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontSize: '12px' }} />
                          <Line type="stepAfter" dataKey="mm" name="Hujan (mm)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL SAVE / EDIT LAHAN ─── */}
      {showSaveModal && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 text-lg tracking-tight">
                {editTarget ? 'Edit Lahan' : 'Simpan Lahan Baru'}
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>
            <form onSubmit={submitLahan} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Nama Lahan <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Mis. Lahan Utara 01"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-xl text-sm outline-none transition-all shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Keterangan</label>
                <textarea
                  rows={3}
                  value={formData.keterangan}
                  onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  placeholder="Catatan kecil untuk lahan ini..."
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-xl text-sm outline-none transition-all resize-none shadow-sm"
                />
              </div>
              {!editTarget && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                  Koordinat poligon yang digambar akan disimpan otomatis.
                </p>
              )}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModals}
                  className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-transparent rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white text-sm font-bold hover:bg-primary-hover rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                  {editTarget ? 'Simpan Perubahan' : 'Simpan Poligon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapDashboard;
