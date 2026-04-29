import logger from '../../utils/logger';
import { useState, useEffect } from 'react';
import { Plus, Trash, Users, Eye, X, WarningCircle, Buildings, MagnifyingGlass } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import {
  getOrganizations,
  createOrganization,
  deleteOrganization,
  getOrganizationUsers,
} from '../../services/organizationService';

const OrganizationList = () => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selection state
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [orgUsers, setOrgUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  // Form state
  const [newOrgName, setNewOrgName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const data = await getOrganizations();
      setOrganizations(data);
    } catch (err) {
      // Errors handled globally by api.js, but we can catch here if needed
      logger.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return toast.error('Nama organisasi wajib diisi.');
    
    setIsSubmitting(true);
    try {
      await createOrganization({ name: newOrgName.trim() });
      toast.success('Organisasi berhasil ditambahkan.');
      setNewOrgName('');
      setIsAddModalOpen(false);
      fetchOrganizations(); // Refresh
    } catch (err) {
      logger.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (org) => {
    setSelectedOrg(org);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteOrg = async () => {
    if (!selectedOrg) return;
    setIsSubmitting(true);
    try {
      await deleteOrganization(selectedOrg.id);
      toast.success('Organisasi berhasil dihapus.');
      setIsDeleteModalOpen(false);
      setSelectedOrg(null);
      fetchOrganizations(); // Refresh
    } catch (err) {
      logger.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewUsers = async (org) => {
    setSelectedOrg(org);
    setIsUsersModalOpen(true);
    setIsUsersLoading(true);
    setOrgUsers([]); // Reset

    try {
      const data = await getOrganizationUsers(org.id);
      setOrgUsers(data);
    } catch (err) {
      logger.error(err);
      toast.error('Gagal mengambil daftar pengguna organisasi.');
      setIsUsersModalOpen(false);
    } finally {
      setIsUsersLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ──── Header Area ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
            <Buildings size={22} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Manajemen Organisasi</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola daftar tenant dan pelanggan platform secara global.</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
        >
          <Plus size={18} weight="bold" />
          Tambah Organisasi
        </button>
      </div>

      {/* ──── Table Section ──── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">ID Organisasi</th>
                <th className="px-6 py-4">Nama Organisasi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Skeleton Rows
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                       <div className="h-8 bg-gray-200 rounded w-24"></div>
                       <div className="h-8 bg-gray-200 rounded w-8"></div>
                    </td>
                  </tr>
                ))
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-400">
                    <Buildings size={32} className="mx-auto mb-3 opacity-20" />
                    Belum ada data organisasi.
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{org.id || '-'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{org.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewUsers(org)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-primary transition-all shadow-sm"
                        >
                          <Eye size={14} weight="bold" /> Users
                        </button>
                        <button
                          onClick={() => handleDeleteClick(org)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Hapus Organisasi"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ──── ADD ORG MODAL ──── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Tambah Organisasi Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Organisasi <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Mis. PT Agronomi Jaya"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
                  autoFocus
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──── DELETE CONFIRMATION MODAL ──── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <WarningCircle size={24} weight="fill" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Organisasi?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Organisasi <strong>{selectedOrg?.name}</strong> akan dihapus permanen. Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors flex-1"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteOrg}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm disabled:opacity-50 transition-colors flex-1"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── VIEW USERS MODAL ──── */}
      {isUsersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsUsersModalOpen(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-xl p-0 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Daftar Pengguna</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedOrg?.name}</p>
              </div>
              <button onClick={() => setIsUsersModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar bg-white">
              {isUsersLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin mb-3"></div>
                  <span className="text-sm">Memuat data pengguna...</span>
                </div>
              ) : orgUsers.length === 0 ? (
                <div className="text-center py-10">
                  <Users size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Tidak ada pengguna yang berafiliasi.</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {orgUsers.map(user => (
                    <li key={user.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border border-gray-200 text-gray-600 bg-gray-50">
                        {user.role}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrganizationList;
