import { useState, useEffect } from 'react';
import {
  Users, Trash, ShieldStar, User as UserIcon, ShieldChevron,
  MagnifyingGlass, Plus, X, UserPlus, Buildings, EnvelopeSimple,
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { getUsers, getUserStats, updateUserRole, deleteUser } from '../../services/userService';
import { registerUser } from '../../services/authService';
import OrbitaniLoader from '../../components/OrbitaniLoader';

/* ── Badge Renderer ── */
const RoleBadge = ({ role }) => {
  const r = (role || 'user').toLowerCase();
  if (r === 'superadmin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
        <ShieldStar size={14} weight="fill" /> Superadmin
      </span>
    );
  }
  if (r === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
        <ShieldChevron size={14} weight="fill" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-gray-100 text-gray-500 border border-gray-200">
      <UserIcon size={14} weight="fill" /> User
    </span>
  );
};

/* ── Skeleton Row ── */
const SkeletonRow = () => (
  <tr className="animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <td key={i} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
    ))}
  </tr>
);

const UserManagement = () => {
  const currentUser = useAuthStore(state => state.user);
  const myRole = currentUser?.role?.toLowerCase() || 'admin';

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', email: '', password: '', role: 'user' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Dialog
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, statsData] = await Promise.allSettled([
        getUsers(),
        getUserStats(),
      ]);
      setUsers(Array.isArray(usersData.value?.data || usersData.value) ? (usersData.value?.data || usersData.value) : []);
      if (statsData.status === 'fulfilled') setStats(statsData.value);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId, targetRole) => {
    if (myRole !== 'superadmin') {
      return toast.error('Hanya Superadmin yang berhak mengubah peran.');
    }
    try {
      await updateUserRole(userId, { role: targetRole });
      toast.success(`Role berhasil diubah menjadi ${targetRole.toUpperCase()}.`);
      setUsers(users.map(u => u.id === userId ? { ...u, role: targetRole } : u));
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengubah role.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    const targetUsername = deleteTarget.username;
    // Optimistic UI: remove row immediately
    setUsers((prev) => prev.filter((u) => u.id !== targetId));
    setDeleteTarget(null);
    try {
      await deleteUser(targetId);
      toast.success(`Pengguna "${targetUsername}" berhasil dihapus.`);
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        toast.error('Aksi ditolak: Anda tidak dapat menghapus akun Anda sendiri.');
      } else {
        toast.error(err.response?.data?.detail || 'Gagal menghapus pengguna.');
      }
      // Rollback: refetch the list
      fetchData();
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await registerUser(addForm);
      toast.success('Pengguna baru berhasil didaftarkan.');
      setShowAddModal(false);
      setAddForm({ username: '', email: '', password: '', role: 'user' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mendaftarkan pengguna.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Compute stats from local data if API stats not available
  const totalUsers = users.length;
  const totalAdmin = users.filter(u => u.role?.toLowerCase() === 'admin').length;
  const totalSuperadmin = users.filter(u => u.role?.toLowerCase() === 'superadmin').length;
  const totalRegular = users.filter(u => u.role?.toLowerCase() === 'user').length;

  const statCards = [
    { label: 'Total Pengguna', value: stats?.total || totalUsers, icon: Users, color: 'text-gray-700' },
    { label: 'Superadmin', value: stats?.superadmin || totalSuperadmin, icon: ShieldStar, color: 'text-purple-600' },
    { label: 'Admin', value: stats?.admin || totalAdmin, icon: ShieldChevron, color: 'text-blue-600' },
    { label: 'Staf Lapangan', value: stats?.user || totalRegular, icon: UserIcon, color: 'text-gray-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ──── Header ──── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100">
            <Users size={24} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Kelola Pengguna</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manajemen akun, hak akses, dan statistik pengguna platform.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover active:scale-95 transition-all shadow-sm"
        >
          <Plus size={18} weight="bold" /> Tambah Pengguna
        </button>
      </div>

      {/* ──── Stat Cards ──── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
              <s.icon size={22} className={s.color} weight="duotone" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ──── Tabel Pengguna ──── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative max-w-sm">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary focus:bg-white focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Organisasi</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="py-16">
                    <div className="flex flex-col items-center gap-3">
                      <OrbitaniLoader size="md" />
                      <p className="text-xs font-semibold text-gray-400">Memuat pengguna...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                    <Users size={36} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Tidak ada pengguna ditemukan.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const uRole = (u.role || 'user').toLowerCase();
                  const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors text-gray-700">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-black border border-gray-200">
                            {(u.username || 'U')[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-gray-900">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{u.email || '-'}</td>
                      <td className="px-6 py-4"><RoleBadge role={uRole} /></td>
                      <td className="px-6 py-4 text-gray-500 text-xs">{u.organization_name || u.organization_id || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Role change — Superadmin only */}
                          {myRole === 'superadmin' && !isSelf && uRole !== 'superadmin' && (
                            <>
                              {uRole === 'user' && (
                                <button
                                  onClick={() => handleUpdateRole(u.id, 'admin')}
                                  className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                                >
                                  ↑ Admin
                                </button>
                              )}
                              {uRole === 'admin' && (
                                <button
                                  onClick={() => handleUpdateRole(u.id, 'user')}
                                  className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200"
                                >
                                  ↓ User
                                </button>
                              )}
                            </>
                          )}

                          {/* Delete — except self & admin can't delete superadmin */}
                          {!isSelf && !(myRole === 'admin' && uRole === 'superadmin') && (
                            <button
                              onClick={() => setDeleteTarget(u)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash size={16} weight="bold" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──── MODAL: Tambah Pengguna ──── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-primary" weight="duotone" />
                <h3 className="font-bold text-gray-900 text-lg">Tambah Pengguna Baru</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <X size={20} weight="bold" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
                <input
                  type="text" required
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="contoh: analis_01"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-xl text-sm outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Email</label>
                <input
                  type="email" required
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="user@perusahaan.com"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-xl text-sm outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Password</label>
                <input
                  type="password" required minLength={6}
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-xl text-sm outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Role</label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 focus:border-primary rounded-xl text-sm outline-none transition-all appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: `right 0.5rem center`,
                    backgroundRepeat: `no-repeat`,
                    backgroundSize: `1.5em 1.5em`,
                  }}
                >
                  <option value="user">User (Staf Lapangan)</option>
                  <option value="admin">Admin (Pelanggan)</option>
                  {myRole === 'superadmin' && <option value="superadmin">Superadmin</option>}
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl">
                  Batal
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-bold hover:bg-primary-hover rounded-xl shadow-sm transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center">
                  {isSubmitting ? <OrbitaniLoader size="sm" /> : 'Daftarkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ──── DIALOG: Konfirmasi Hapus ──── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-100 p-6 text-center animate-fade-in">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center border border-red-100">
              <Trash size={28} className="text-red-500" weight="duotone" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Hapus Pengguna?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Akun <span className="font-bold text-gray-900">{deleteTarget.username}</span> akan dihapus secara permanen dan tidak bisa dikembalikan.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Batal
              </button>
              <button onClick={confirmDelete} className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-sm transition-all">
                Ya, Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
