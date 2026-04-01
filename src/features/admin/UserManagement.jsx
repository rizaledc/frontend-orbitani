import { useState, useEffect } from 'react';
import { Users, Trash, ShieldStar, User as UserIcon, ShieldChevron, SpinnerGap } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Baca peran diri sendiri dari authStore
  const currentUser = useAuthStore(state => state.user);
  const myRole = currentUser?.role?.toLowerCase() || 'admin'; // fallback 

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/users');
      setUsers(res.data?.data || res.data || []);
    } catch (err) {
      console.warn("Users API Error:", err);
      if (!err.response || err.response.status === 404) {
        setUsers([
          { id: 1, username: "OrbitaniCorp", role: "superadmin" },
          { id: 2, username: "admin_jabar", role: "admin" },
          { id: 3, username: "petani_01", role: "user" },
          { id: 4, username: "demo_guest", role: "user" }
        ]);
        toast.error("Beralih ke Dummy Users (API /api/users belum siap)");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (userId, targetRole) => {
    // RBAC Check via Frontend state
    if (myRole !== 'superadmin') {
      toast.error('Hanya Superadmin yang berhak mengubah peran pengguna!');
      return;
    }

    try {
      await api.put(`/api/users/${userId}/role`, { role: targetRole });
      toast.success(`Berhasil mengubah role pengguna menjadi ${targetRole.toUpperCase()}`);
      
      // Update local state without refetching immediately for snappy UI
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: targetRole } : u
      ));
    } catch (err) {
      const msg = err.response?.data?.detail || "Gagal mengubah role pengguna.";
      toast.error(typeof msg === 'string' ? msg : "Format error role tak terduga.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pengguna ini secara permanen?")) return;
    
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success("Pengguna berhasil dihapus.");
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      const msg = err.response?.data?.detail || "Gagal menghapus pengguna.";
      toast.error(typeof msg === 'string' ? msg : "Kendala saat penghapusan.");
    }
  };

  const RENDER_BADGE = (role) => {
    const r = role.toLowerCase();
    if (r === 'superadmin') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800"><ShieldStar weight="fill" /> Superadmin</span>;
    }
    if (r === 'admin') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><ShieldChevron weight="fill" /> Admin</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700"><UserIcon weight="fill" /> User Umum</span>;
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto flex flex-col h-full animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-text dark:text-white tracking-tight flex items-center gap-3">
          <Users size={32} className="text-primary dark:text-accent" weight="duotone" />
          Manajemen Pengguna
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm leading-relaxed">
          Atur hak akses platform. Pangkat Anda saat ini adalah <strong className="uppercase text-primary dark:text-accent">{myRole}</strong>.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-gray-700 flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-14 text-gray-400">
             <SpinnerGap size={40} className="animate-spin text-primary dark:text-accent mb-4" />
             <p>Memuat direktori anggota...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-primary/5 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">ID Anggota</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Username</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Pangkat / Role</th>
                  <th className="px-6 py-4 font-semibold text-right uppercase tracking-wider text-xs">Aksi & Kendali</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {users.map((u) => {
                  const uRole = u.role?.toLowerCase() || 'user';
                  // Kita cegah user mengubah diri sendiri
                  const isSelf = currentUser?.id === u.id || currentUser?.username === u.username;
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">#{u.id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">{u.username}</td>
                      <td className="px-6 py-4">{RENDER_BADGE(uRole)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          
                          {/* ONLY SUPERADMIN can see promotion buttons */}
                          {myRole === 'superadmin' && !isSelf && uRole !== 'superadmin' && (
                            <>
                              {uRole === 'user' && (
                                <button 
                                  onClick={() => handleUpdateRole(u.id, 'admin')}
                                  className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                >
                                  Naikkan ke Admin
                                </button>
                              )}
                              {uRole === 'admin' && (
                                <button 
                                  onClick={() => handleUpdateRole(u.id, 'user')}
                                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors text-center"
                                >
                                  Turunkan ke User
                                </button>
                              )}
                            </>
                          )}

                          {/* EVERYONE can see Delete Button EXCEPT for yourself and for other superadmins (if you are just admin) */}
                          {(!isSelf && !(myRole === 'admin' && uRole === 'superadmin')) && (
                            <button 
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-2 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash size={18} weight="bold" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
