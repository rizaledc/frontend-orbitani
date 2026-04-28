import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap, LayersControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { X, MagnifyingGlass, Farm, Polygon, List, CaretLeft, Check,
  CaretUp, CaretDown, CaretRight, MagnifyingGlassPlus, MagnifyingGlassMinus, Crosshair,
  PencilSimple, Trash, Plant, ArrowClockwise
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useLahanStore from '../../store/useLahanStore';
import { createLahan, getLahanData, deleteLahan, updateLahan } from '../../services/lahanService';
import { getHistoryByLahan } from '../../services/historyService';
import OrbitaniLoader from '../../components/OrbitaniLoader';

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

const MapDashboard = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'user';
  const canDraw = true;

  // ── Lahan Store ──
  const { lahanList, isLoading, fetchLahan, setLahanList, analyzeLahan, analyzingId } = useLahanStore();

  const mapRef = useRef(null);
  const mapWrapperRef = useRef(null);
  const DEFAULT_CENTER = [-2.5, 118.0];

  // UX States
  const [isListMinimized, setIsListMinimized] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // States for Map & Drawing
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [drawnGeoJson, setDrawnGeoJson] = useState(null);
  const [formData, setFormData] = useState({ nama: '', keterangan: '' });
  const [editTarget, setEditTarget] = useState(null); // lahan being edited (null = create mode)
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, lahan: null });

  // States for Slide-over
  const [selectedLahan, setSelectedLahan] = useState(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [lahanDetail, setLahanDetail] = useState(null);
  // Biofisik data extracted from the history API (most reliable source)
  const [lahanBiofisik, setLahanBiofisik] = useState(null);
  // Per-point satellite sample data (array of 10 points)
  const [samplePoints, setSamplePoints] = useState([]);

  /**
   * Normalises a raw history row into the biofisik shape expected by the card.
   * Mirrors the mapRowData logic in HistoryReport so key variants from the
   * backend are all handled consistently.
   */
  const mapHistoryRowToBiofisik = (row) => {
    if (!row) return null;
    const src = row.satellite_results || row.data || row;
    const num = (v, dec) => {
      const n = Number(src[v] ?? row[v]);
      return isNaN(n) ? null : dec != null ? n : n;
    };
    return {
      n:           num('nitrogen')    ?? num('n'),
      p:           num('fosfor')      ?? num('phosphorus') ?? num('p'),
      k:           num('kalium')      ?? num('potassium')  ?? num('k'),
      ph:          num('ph')          ?? num('pH'),
      temperature: num('tci')         ?? num('temperature') ?? num('temp'),
      humidity:    num('ndti')        ?? num('humidity')   ?? num('humid'),
      rainfall:    num('rainfall')    ?? num('rain')       ?? num('curah_hujan'),
    };
  };

  /** Fetches the most recent history row for a lahan and sets lahanBiofisik + samplePoints. */
  const refreshBiofisik = async (lahanId) => {
    try {
      const rows = await getHistoryByLahan(lahanId);
      if (Array.isArray(rows) && rows.length > 0) {
        // Sort descending by created_at and take the freshest row
        const sorted = [...rows].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        const freshRow = sorted[0];
        const biofisik = mapHistoryRowToBiofisik(freshRow);
        setLahanBiofisik(biofisik);
        // Extract per-point satellite_results if available
        const pts = freshRow?.satellite_results ?? freshRow?.titik_sampel ?? [];
        setSamplePoints(Array.isArray(pts) ? pts : []);
      } else {
        setLahanBiofisik(null);
        setSamplePoints([]);
      }
    } catch {
      setLahanBiofisik(null);
      setSamplePoints([]);
    }
  };

  // NOTE: init effect is placed AFTER fetchAnalyticsData is defined (see below)
  //       to avoid capturing an undefined reference in the closure.

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

  /**
   * handleAnalyzeLahan — Triggers the AI spatial analysis for the selected lahan.
   * On success the store updates lahanList optimistically; we also sync the
   * local selectedLahan reference so the slide-over rerenders immediately.
   */
  const handleAnalyzeLahan = async () => {
    if (!selectedLahan) return;
    const updated = await analyzeLahan(selectedLahan.id);
    if (updated) {
      // Try to surface rata_rata_fitur from every possible path in the
      // analyze response before falling back to a /data re-fetch.
      const rrfFromAnalyze =
        updated.rata_rata_fitur ??
        updated.data?.rata_rata_fitur ??
        updated.features ??
        updated.rata_rata ??
        null;

      setSelectedLahan((prev) => ({
        ...prev,
        ...updated,
        ...(rrfFromAnalyze ? { rata_rata_fitur: rrfFromAnalyze } : {}),
      }));

      // Refresh biofisik from history (most reliable source)
      await refreshBiofisik(selectedLahan.id);

      // Also re-fetch /data for completeness
      try {
        const freshDetail = await getLahanData(selectedLahan.id);
        setLahanDetail(freshDetail);
      } catch { /* non-critical */ }
    }
  };

  useEffect(() => {
    fetchLahan();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLahan]);

  const handlePolygonDrawn = (geojson) => {
    setDrawnGeoJson(geojson);
    setShowSaveModal(true);
  };

  // ── Create or Update Lahan ──
  const submitLahan = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formData.nama.trim()) {
      toast.error('Nama lahan wajib diisi.');
      return;
    }

    setIsSaving(true);
    try {
      if (editTarget) {
        await updateLahan(editTarget.id, {
          nama: formData.nama,
          keterangan: formData.keterangan,
        });
        toast.success('Lahan berhasil diperbarui.');
      } else {
        if (!drawnGeoJson) { toast.error('Gambar poligon terlebih dahulu.'); setIsSaving(false); return; }
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
    } finally {
      setIsSaving(false);
    }
  };

  // ── Delete with Optimistic UI ──
  const handleDeleteLahan = (e, lahan) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, lahan }); // Buka modal custom
  };

  const confirmDelete = async () => {
    const { lahan } = deleteConfirm;
    if (!lahan) return;

    // Optimistic remove via store setter
    setLahanList(lahanList.filter((l) => l.id !== lahan.id));
    if (selectedLahan?.id === lahan.id) setIsSlideOpen(false);
    setDeleteConfirm({ isOpen: false, lahan: null });
    
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
    setFormData({ nama: lahan.name || lahan.nama || '', keterangan: lahan.description || lahan.deskripsi || lahan.keterangan || '' });
    setDrawnGeoJson(null);
    setShowSaveModal(true);
  };

  const handleLahanClick = async (lahan) => {
    setSelectedLahan(lahan);
    setIsSlideOpen(true);
    setIsDataLoading(true);
    setLahanDetail(null);
    setLahanBiofisik(null);
    setSamplePoints([]);
    // On mobile, minimize list automatically when selecting so map + slideover are visible
    if (window.innerWidth < 768) {
      setIsListMinimized(true);
    }
    try {
      // Run both in parallel: cached /data AND history rows for this lahan
      const [detail] = await Promise.allSettled([
        getLahanData(lahan.id),
        refreshBiofisik(lahan.id),   // sets lahanBiofisik + samplePoints directly
      ]);
      if (detail.status === 'fulfilled') setLahanDetail(detail.value);
    } catch (err) {
      console.error('[MapDashboard] getLahanData error:', err);
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

  const filteredLahan = lahanList.filter((l) => {
    // Backend returns `nama` (Indonesian field), with `name` as a possible alias.
    // Always fall back through both to avoid returning false on every item.
    const lahanName = l.name || l.nama || '';
    return lahanName.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        {/* FlyTo uses geojson || koordinat — backend sends data under koordinat */}
        <MapController selectedGeoJson={selectedLahan?.geojson || selectedLahan?.koordinat} />

        {lahanList.map((lahan) => {
          // Support both field names: geojson (legacy) and koordinat (current backend)
          const spatialData = lahan.geojson || lahan.koordinat;
          if (!spatialData) return null;
          return (
            <GeoJSON
              key={lahan.id}
              data={spatialData}
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

        {/* ── Render Sampling Points if available ── */}
        {selectedLahan?.titik_sampling && selectedLahan.titik_sampling.map((pt, idx) => {
          // pt can be [lon, lat] or {lat, lon}. We need [lat, lon] for Leaflet
          const lat = Array.isArray(pt) ? pt[1] : pt.lat;
          const lon = Array.isArray(pt) ? pt[0] : pt.lon;
          return (
            <CircleMarker
              key={`sp-${idx}`}
              center={[lat, lon]}
              radius={4}
              pathOptions={{ color: '#f59e0b', fillColor: '#facc15', fillOpacity: 0.9, weight: 1.5 }}
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
                <div className="flex flex-col items-center justify-center p-10 gap-3">
                  <OrbitaniLoader size="md" />
                  <p className="text-[11px] font-semibold text-gray-400">Memuat lahan...</p>
                </div>
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
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{lahan.description || lahan.deskripsi || lahan.keterangan || '-'}</p>
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
              <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{selectedLahan?.name || selectedLahan?.nama || 'Detail Lahan'}</h2>
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
                {/* ── Analisis Tanaman (AI) Button ── */}
                {(() => {
                  const isThisAnalyzing = analyzingId === selectedLahan?.id;
                  const hasResult = Array.isArray(selectedLahan?.hasil_rekomendasi) && selectedLahan.hasil_rekomendasi.length > 0;
                  return (
                    <button
                      id="btn-analyze-lahan"
                      onClick={handleAnalyzeLahan}
                      disabled={isThisAnalyzing || !!analyzingId}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl font-bold text-sm transition-all
                        bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]
                        disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      {isThisAnalyzing ? (
                        <>
                          <OrbitaniLoader size="sm" />
                          <span>Menganalisis Lahan...</span>
                        </>
                      ) : (
                        <>
                          {hasResult
                            ? <ArrowClockwise size={16} weight="bold" />
                            : <Plant size={16} weight="duotone" />}
                          <span>{hasResult ? 'Analisis Ulang / Perbarui' : 'Analisis Tanaman (AI)'}</span>
                        </>
                      )}
                    </button>
                  );
                })()}

                {/* ── Hasil Rekomendasi Card ── */}
                {Array.isArray(selectedLahan?.hasil_rekomendasi) && selectedLahan.hasil_rekomendasi.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Card Header */}
                    <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                      <Plant size={16} className="text-emerald-600" weight="duotone" />
                      <h3 className="text-sm font-bold text-gray-900 tracking-tight">Rekomendasi Tanaman AI</h3>
                    </div>

                    {/* Rekomendasi List */}
                    <ul className="divide-y divide-gray-50">
                      {selectedLahan.hasil_rekomendasi.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Rank indicator */}
                            <span className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-900">{item.tanaman}</span>
                          </div>
                          {/* Percentage badge */}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 tracking-wide">
                            {item.persentase}%
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Footer: Last analyzed timestamp */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/60">
                      <p className="text-[11px] text-gray-400 font-medium">
                        Terakhir dianalisis:{' '}
                        <span className="text-gray-500 font-semibold">
                          {formatDate(selectedLahan.terakhir_dianalisis)}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Kondisi Biofisik Lahan (Satelit) ── */}
                {(() => {
                  // Priority: history rows → rata_rata_fitur from analyze → /data endpoint
                  const biofisik =
                    lahanBiofisik ??
                    selectedLahan?.rata_rata_fitur ??
                    lahanDetail?.rata_rata_fitur ??
                    lahanDetail?.data?.rata_rata_fitur ??
                    null;

                  const hasRekomendasi =
                    Array.isArray(selectedLahan?.hasil_rekomendasi) &&
                    selectedLahan.hasil_rekomendasi.length > 0;

                  // If no biofisik data but recommendations exist, show a
                  // subtle placeholder so users know the section is there.
                  if (!biofisik) {
                    return hasRekomendasi ? (
                      <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Kondisi Biofisik Lahan (Satelit)
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Data lingkungan belum tersedia. Coba analisis ulang untuk memperbarui.
                        </p>
                      </div>
                    ) : null;
                  }

                  const fmt = (val, dec = 1) =>
                    val != null ? Number(val).toFixed(dec) : '–';

                  const metrics = [
                    { label: 'N',           value: fmt(biofisik.n),           unit: 'mg/kg', wide: false },
                    { label: 'P',           value: fmt(biofisik.p),           unit: 'mg/kg', wide: false },
                    { label: 'K',           value: fmt(biofisik.k),           unit: 'mg/kg', wide: false },
                    { label: 'pH',          value: fmt(biofisik.ph, 2),       unit: '',      wide: false },
                    { label: 'Temp (TCI)',  value: fmt(biofisik.temperature, 2), unit: '',   wide: false },
                    { label: 'Humid (NDTI)',value: fmt(biofisik.humidity, 2), unit: '',      wide: false },
                    { label: 'Rainfall',    value: fmt(biofisik.rainfall),    unit: 'mm',    wide: true,
                      accent: true },
                  ];

                  return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
                      {/* Card header — matches Rekomendasi card style */}
                      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                          viewBox="0 0 256 256" className="text-blue-500" fill="currentColor">
                          <path d="M213.66,82.34l-56-56a8,8,0,0,0-11.32,0l-96,96a8,8,0,0,0,0,11.32l56,56a8,8,0,0,0,11.32,0l96-96A8,8,0,0,0,213.66,82.34ZM128,180.69,75.31,128,128,75.31,180.69,128Z"/>
                        </svg>
                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                          Kondisi Biofisik Lahan
                        </h3>
                        <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          Satelit
                        </span>
                      </div>

                      {/* Metrics grid */}
                      <div className="p-4 grid grid-cols-3 gap-3">
                        {metrics.map(({ label, value, unit, wide, accent }) => (
                          <div
                            key={label}
                            className={`flex flex-col gap-0.5 rounded-lg p-2.5 ${
                              wide ? 'col-span-3' : ''
                            } ${
                              accent
                                ? 'bg-blue-50 border border-blue-100'
                                : 'bg-gray-50 border border-gray-100'
                            }`}
                          >
                            <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                              accent ? 'text-blue-500' : 'text-gray-400'
                            }`}>
                              {label}
                            </span>
                            <span className={`text-sm font-extrabold ${
                              accent ? 'text-blue-800' : 'text-gray-900'
                            }`}>
                              {value}
                              {unit && (
                                <span className={`ml-1 text-[10px] font-normal ${
                                  accent ? 'text-blue-400' : 'text-gray-400'
                                }`}>
                                  {unit}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* ═══════════════════════════════════════════
                    FEATURE 2 — Data Per Titik Sampel
                    ═══════════════════════════════════════════ */}
                {samplePoints.length > 0 && (() => {
                  const getN     = (r) => r?.N     ?? r?.nitrogen    ?? r?.n    ?? null;
                  const getP     = (r) => r?.P     ?? r?.fosfor      ?? r?.phosphorus ?? r?.p ?? null;
                  const getK     = (r) => r?.K     ?? r?.kalium      ?? r?.potassium  ?? r?.k ?? null;
                  const getPH    = (r) => r?.pH    ?? r?.ph          ?? null;
                  const getTemp  = (r) => r?.temperature ?? r?.temp  ?? r?.suhu ?? r?.tci ?? null;
                  const getHumid = (r) => r?.humidity    ?? r?.humid ?? r?.kelembapan ?? r?.ndti ?? null;
                  const getRain  = (r) => r?.rainfall    ?? r?.rain  ?? r?.curah_hujan ?? null;
                  const getReko  = (r) => r?.rekomendasi ?? r?.recommendation ?? r?.label ?? '-';
                  const fmt      = (v, d = 1) => v != null ? Number(v).toFixed(d) : '–';

                  const calcStats = (arr, getter) => {
                    const vals = arr.map(getter).filter((v) => v != null);
                    if (!vals.length) return null;
                    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
                    const std  = Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length);
                    return { min: Math.min(...vals), max: Math.max(...vals), mean, std };
                  };

                  const nStats = calcStats(samplePoints, getN);
                  const pStats = calcStats(samplePoints, getP);
                  const kStats = calcStats(samplePoints, getK);
                  const nMax   = nStats?.max || 1;

                  return (
                    <>
                      {/* Per-point table */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" className="text-emerald-500"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/></svg>
                          <h3 className="text-sm font-bold text-gray-900 tracking-tight">Data Per Titik Sampel</h3>
                          <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {samplePoints.length} titik
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-xs">
                            <thead className="bg-gray-50">
                              <tr>
                                {['No','N','P','K','pH','Suhu','Lembab','Hujan','Rekomendasi'].map((h) => (
                                  <th key={h} className="px-2.5 py-2 text-left font-bold text-gray-400 whitespace-nowrap border-b border-gray-100">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {samplePoints.map((pt, idx) => (
                                <tr key={idx} className="even:bg-gray-50/60 hover:bg-emerald-50/40 transition-colors">
                                  <td className="px-2.5 py-2 font-bold text-gray-300">{idx + 1}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getN(pt))}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getP(pt))}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getK(pt))}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getPH(pt), 2)}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getTemp(pt))}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getHumid(pt))}</td>
                                  <td className="px-2.5 py-2 text-gray-700">{fmt(getRain(pt), 0)}</td>
                                  <td className="px-2.5 py-2 font-semibold text-emerald-600 whitespace-nowrap">{getReko(pt)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* NPK Stats row */}
                        {(nStats || pStats || kStats) && (
                          <div className="p-4 pt-3 grid grid-cols-3 gap-2 border-t border-gray-100 bg-gray-50/50">
                            {[{ label: 'N', stats: nStats }, { label: 'P', stats: pStats }, { label: 'K', stats: kStats }].map(({ label, stats }) =>
                              stats ? (
                                <div key={label} className="bg-white rounded-lg p-2.5 border border-gray-100">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{label} (mg/kg)</p>
                                  <div className="space-y-0.5 text-[11px]">
                                    <div className="flex justify-between"><span className="text-gray-400">Min</span><span className="font-semibold text-gray-700">{fmt(stats.min)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Rata</span><span className="font-semibold text-gray-700">{fmt(stats.mean)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Max</span><span className="font-semibold text-gray-700">{fmt(stats.max)}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-400">Std</span><span className="font-semibold text-gray-700">{fmt(stats.std)}</span></div>
                                  </div>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}
                      </div>

                      {/* ═══ FEATURE 3 — Distribusi Nitrogen (N) ═══ */}
                      {nStats && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                          <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" className="text-blue-500"><path d="M232,208a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16H224A8,8,0,0,1,232,208ZM88,168a8,8,0,0,0,8-8V88a8,8,0,0,0-16,0v72A8,8,0,0,0,88,168Zm40,0a8,8,0,0,0,8-8V40a8,8,0,0,0-16,0V160A8,8,0,0,0,128,168Zm40,0a8,8,0,0,0,8-8V120a8,8,0,0,0-16,0v40A8,8,0,0,0,168,168Z"/></svg>
                            <h3 className="text-sm font-bold text-gray-900 tracking-tight">Distribusi Nitrogen (N) per Titik</h3>
                          </div>
                          <div className="p-4 space-y-2">
                            {samplePoints.map((pt, idx) => {
                              const val = getN(pt);
                              const pct = val != null ? Math.max(3, (val / nMax) * 100) : 0;
                              return (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  <span className="w-5 text-right text-gray-400 font-mono shrink-0">{idx + 1}</span>
                                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%`, backgroundColor: '#378ADD' }}
                                    />
                                  </div>
                                  <span className="w-10 text-right text-gray-600 font-semibold shrink-0">{fmt(val)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mx-4 mb-4 flex items-center gap-4 text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <span>Min <b className="text-gray-700">{fmt(nStats.min)}</b></span>
                            <span>Mean <b className="text-gray-700">{fmt(nStats.mean)}</b></span>
                            <span>Max <b className="text-gray-700">{fmt(nStats.max)}</b></span>
                            <span>Std <b className="text-gray-700">{fmt(nStats.std)}</b></span>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* ═══════════════════════════════════════════
                    FEATURE 4 — SHAP Feature Importance
                    ═══════════════════════════════════════════ */}
                {(() => {
                  const SHAP_DATA = [
                    { label: 'Humidity',     value: 0.0317 },
                    { label: 'N',            value: 0.0267 },
                    { label: 'K',            value: 0.0252 },
                    { label: 'Rainfall',     value: 0.0251 },
                    { label: 'P',            value: 0.0229 },
                    { label: 'Temperature',  value: 0.0098 },
                    { label: 'pH',           value: 0.0046 },
                  ];
                  const SHAP_MAX = SHAP_DATA[0].value;
                  return (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor" className="text-amber-500"><path d="M197.58,129.06l-51.1-19-19-51.07a15.92,15.92,0,0,0-29.88,0L78.52,110l-51.07,19a15.92,15.92,0,0,0,0,29.88l51.07,19,19,51.07a15.92,15.92,0,0,0,29.88,0l19-51.07,51.07-19a15.92,15.92,0,0,0,0-29.88Z"/></svg>
                        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Kontribusi Fitur (SHAP)</h3>
                      </div>
                      <div className="p-4 space-y-2">
                        {SHAP_DATA.map((item) => {
                          const pct = Math.max(3, (item.value / SHAP_MAX) * 100);
                          const isHigh = item.value >= 0.023;
                          return (
                            <div key={item.label} className="flex items-center gap-2 text-xs">
                              <span className="w-20 text-right text-gray-500 shrink-0">{item.label}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: isHigh ? '#22c55e' : '#60a5fa' }}
                                />
                              </div>
                              <span className="w-12 text-right text-gray-600 font-semibold shrink-0">{item.value.toFixed(4)}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mx-4 mb-4 text-[11px] text-gray-400 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        Nilai SHAP menunjukkan pengaruh rata-rata setiap fitur terhadap keputusan model Random Forest
                      </div>
                    </div>
                  );
                })()}

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
                  disabled={isSaving}
                  className="px-6 py-2 bg-primary text-white text-sm font-bold hover:bg-primary-hover rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px] flex items-center justify-center"
                >
                  {isSaving ? (
                    <OrbitaniLoader size="sm" />
                  ) : (
                    editTarget ? 'Simpan Perubahan' : 'Simpan Poligon'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      {deleteConfirm.isOpen && (
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-6 text-center animate-scale-in">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={24} weight="bold" />
            </div>
            <h3 className="text-gray-900 font-bold mb-2">Hapus Lahan?</h3>
            <p className="text-gray-500 text-xs mb-6">
              Lahan <span className="font-bold text-gray-700">"{deleteConfirm.lahan?.name || deleteConfirm.lahan?.nama}"</span> akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm({ isOpen: false, lahan: null })}
                className="flex-1 py-2.5 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MapDashboard;
