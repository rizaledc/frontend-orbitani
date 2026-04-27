import { create } from 'zustand';
import toast from 'react-hot-toast';
import { getAllLahan, analyzeLahanSpatial } from '../services/lahanService';

/**
 * useLahanStore — Canonical state owner for the lahan list.
 *
 * Actions:
 *  - fetchLahan()           : Load / reload all lahan from the API.
 *  - analyzeLahan(id)       : POST /api/lahan/{id}/analyze, then optimistically
 *                             replace the lahan object in the list so the UI
 *                             shows hasil_rekomendasi without a full page refresh.
 *  - setLahanList(list)     : Direct setter (useful for optimistic delete/create).
 *  - setAnalyzingId(id|null): Track which lahan is currently being analyzed.
 */
const useLahanStore = create((set, get) => ({
  lahanList: [],
  isLoading: false,
  analyzingId: null, // id of lahan currently being analyzed

  setLahanList: (list) => set({ lahanList: list }),

  setAnalyzingId: (id) => set({ analyzingId: id }),

  fetchLahan: async () => {
    set({ isLoading: true });
    try {
      // getAllLahan() already unwraps the backend envelope:
      //   axios response.data        → { status: "success", data: [...] }
      //   service response.data.data → the plain lahan array
      // So `data` here is already the raw array — no extra .data needed.
      const data = await getAllLahan();

      console.log("=== DATA DARI SERVICE ===");
      console.log("Isi data:", data);
      console.log("Apakah Array?", Array.isArray(data));
      console.log("Tipe data:", typeof data);
      console.log("=========================");

      set({ lahanList: Array.isArray(data) ? data : [] });
    } catch (err) {
      console.error('[useLahanStore] fetchLahan error:', err);
      set({ lahanList: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * analyzeLahan — Runs spatial AI analysis on a single lahan polygon.
   *
   * On success the backend returns the updated LahanOut object with:
   *   - hasil_rekomendasi : Array<{ tanaman: string, persentase: number }>
   *   - terakhir_dianalisis : ISO timestamp string
   *
   * The store replaces the old lahan object in the list optimistically so
   * every subscriber (slide-over, list cards, etc.) re-renders automatically.
   *
   * @param {string|number} id  - Lahan ID
   * @returns {object|null}     - Updated lahan object, or null on failure.
   */
  analyzeLahan: async (id) => {
    if (get().analyzingId) return null; // Prevent concurrent analysis
    set({ analyzingId: id });

    try {
      const updatedLahan = await analyzeLahanSpatial(id);

      // Optimistic list update: replace old object with fresh server response
      set((state) => ({
        lahanList: state.lahanList.map((l) =>
          l.id === id ? { ...l, ...updatedLahan } : l
        ),
      }));

      toast.success('Analisis AI selesai!', { icon: '🌱' });
      return updatedLahan;
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === 'string'
          ? detail
          : 'Analisis AI gagal. Coba lagi.';
      toast.error(msg);
      return null;
    } finally {
      set({ analyzingId: null });
    }
  },
}));

export default useLahanStore;
