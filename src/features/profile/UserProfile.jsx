import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Sun, Moon, Desktop, LockKey, Buildings, CheckCircle, UploadSimple, X } from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate = useNavigate();

  // Basic Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  // Password Form State
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [isSavingPass, setIsSavingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Handlers
  const handleSaveBasic = async (e) => {
    e.preventDefault();
    setIsSavingBasic(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingBasic(false);
      toast.success('Profil dasar berhasil diperbarui.');
    }, 800);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error('Password baru dan konfirmasi tidak cocok.');
    }
    if (passwords.new.length < 6) {
      return toast.error('Password baru minimal 6 karakter.');
    }
    setIsSavingPass(true);
    // Simulate API call
    setTimeout(() => {
      setIsSavingPass(false);
      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Kata sandi berhasil diperbarui.');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ──── Header ──── */}
      <div className="flex items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center border border-primary-100 shrink-0">
            <User size={24} className="text-primary" weight="duotone" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pengaturan Profil</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola data diri, keamanan akun, dan preferensi tampilan Anda.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
          aria-label="Tutup Pengaturan"
        >
          <X size={20} weight="bold" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* ──── Left Column ──── */}
        <div className="md:col-span-7 space-y-6">

          {/* CARD 1: Profil Dasar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-start gap-8">
            <h2 className="text-base font-bold text-gray-900 w-full mb-2">Informasi Pribadi</h2>
            
            {/* Avatar Section */}
            <div className="flex items-center gap-6 w-full pb-6 border-b border-gray-100">
              <div className="relative">
                <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center overflow-hidden border border-gray-200">
                   {user?.avatar_url ? (
                     <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <User size={36} weight="fill" />
                   )}
                </div>
              </div>
              <div>
                <button type="button" className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm mb-2">
                  <UploadSimple size={16} weight="bold" /> Unggah Foto
                </button>
                <p className="text-xs text-gray-400">Rekomendasi ukuran 256x256px dengan max 2MB.</p>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSaveBasic} className="w-full space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor Telepon</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  placeholder="Mis. 08123456789"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
                />
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingBasic}
                  className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-sm active:scale-95 transition-all text-center disabled:opacity-50"
                >
                  {isSavingBasic ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* CARD 3: Keamanan */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2">
               <LockKey size={20} className="text-gray-500" weight="duotone" />
               <h2 className="text-base font-bold text-gray-900">Keamanan Sandi</h2>
            </div>
            
            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Lama</label>
                <input
                  type="password"
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Baru</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPass}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 hover:text-primary shadow-sm active:scale-95 transition-all text-center disabled:opacity-50"
                >
                  {isSavingPass ? 'Memperbarui...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* ──── Right Column ──── */}
        <div className="md:col-span-5 space-y-6">

          {/* CARD 2: Informasi Akses (Read Only) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
               <ShieldCheck size={20} className="text-primary" weight="duotone" />
               <h2 className="text-base font-bold text-gray-900">Informasi Akses</h2>
            </div>
            
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Alamat Email</p>
                <p className="text-sm font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 w-full truncate">
                  {user?.email || 'email@contoh.com'}
                </p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Perusahaan / Tenant</p>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                  <Buildings size={16} className="text-primary" weight="fill" />
                  <span className="truncate">{user?.organization_id || 'OrbitaniCorp Global'}</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role Sistem</p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary border border-primary-100 rounded-md text-xs font-black uppercase tracking-wider">
                  <CheckCircle size={14} weight="bold" /> {user?.role || 'user'}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 4: Preferensi Tema */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Tampilan Visual</h2>
                <p className="text-xs text-gray-500 mt-1">Ubah preferensi mode warna UI.</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                {theme === 'dark' ? <Moon size={20} weight="fill" /> : <Sun size={20} weight="fill" />}
              </div>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner">
              {[
                { id: 'light', label: 'Terang', icon: Sun },
                { id: 'dark', label: 'Gelap', icon: Moon },
                { id: 'system', label: 'Sistem', icon: Desktop },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    theme === opt.id 
                      ? 'bg-white text-gray-900 shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/50'
                  }`}
                >
                  <opt.icon size={14} weight={theme === opt.id ? "bold" : "regular"} />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
