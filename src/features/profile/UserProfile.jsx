import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, ShieldCheck, LockKey, Buildings, CheckCircle, X, Eye, EyeSlash,
  PencilSimple, SpinnerGap,
} from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';
import { updateMyProfile, updatePassword } from '../../services/userService';
import toast from 'react-hot-toast';

const UserProfile = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  /* ── Editable Profile State ── */
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    description: '',
  });

  /* ── Password State ── */
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Loading States ── */
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  /* ── Sync store → form ── */
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        username: user.username || '',
        description: user.description || '',
      });
    }
  }, [user]);

  /* ── Derived ── */
  const passwordMismatch = passwords.new_password && passwords.confirm && passwords.new_password !== passwords.confirm;
  const passwordFormValid =
    passwords.old_password.length > 0 &&
    passwords.new_password.length >= 8 &&
    passwords.new_password === passwords.confirm;

  /* ══════════════════════════════════════════
     HANDLER: Save Profile (PATCH /api/users/me)
     ══════════════════════════════════════════ */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      // Only send fields that changed
      const payload = {};
      if (profileData.name !== (user?.name || '')) payload.name = profileData.name;
      if (profileData.username !== (user?.username || '')) payload.username = profileData.username;
      if (profileData.description !== (user?.description || '')) payload.description = profileData.description;

      if (Object.keys(payload).length === 0) {
        toast('Tidak ada perubahan yang perlu disimpan.', { icon: 'ℹ️' });
        setIsSavingProfile(false);
        return;
      }

      const res = await updateMyProfile(payload);
      // Immediately reflect changes in Navbar via authStore
      updateUser(res.data || payload);
      toast.success('Profil berhasil diperbarui!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((e) => e.msg).join('; ')
        : (typeof detail === 'string' ? detail : 'Gagal memperbarui profil.');
      toast.error(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  /* ══════════════════════════════════════════════
     HANDLER: Change Password (PUT /api/auth/update-password)
     ══════════════════════════════════════════════ */
  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordMismatch) return;
    setIsSavingPassword(true);

    try {
      await updatePassword({
        old_password: passwords.old_password,
        new_password: passwords.new_password,
      });
      setPasswords({ old_password: '', new_password: '', confirm: '' });
      toast.success('Password berhasil diperbarui!');
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) {
        toast.error('Password lama salah. Silakan coba lagi.');
      } else {
        const detail = err.response?.data?.detail;
        toast.error(typeof detail === 'string' ? detail : 'Gagal memperbarui password.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  /* ═══════════════ SHARED INPUT STYLES ═══════════════ */
  const inputBase = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-xl text-sm text-gray-900 outline-none transition-all';
  const inputDisabled = 'w-full px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-500 cursor-not-allowed select-all';

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
            <p className="text-sm text-gray-500 mt-0.5">Kelola data diri dan keamanan akun Anda.</p>
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

          {/* ═══ CARD 1: Informasi Pribadi (Editable) ═══ */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <PencilSimple size={20} className="text-primary" weight="duotone" />
              <h2 className="text-base font-bold text-gray-900">Informasi Pribadi</h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="profile-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className={inputBase}
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="profile-username" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  id="profile-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  placeholder="Masukkan username"
                  className={inputBase}
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="profile-description" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Deskripsi / Bio
                </label>
                <textarea
                  id="profile-description"
                  name="description"
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  placeholder="Ceritakan singkat tentang diri Anda..."
                  rows={3}
                  className={`${inputBase} resize-none`}
                />
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-hover shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSavingProfile && <SpinnerGap size={16} className="animate-spin" />}
                  {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>

          {/* ═══ CARD 2: Keamanan Sandi ═══ */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <LockKey size={20} className="text-gray-500" weight="duotone" />
              <h2 className="text-base font-bold text-gray-900">Keamanan Sandi</h2>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-4">
              {/* Old Password */}
              <div>
                <label htmlFor="pw-old" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Password Lama
                </label>
                <div className="relative">
                  <input
                    id="pw-old"
                    name="old_password"
                    type={showOld ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={passwords.old_password}
                    onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                    className={inputBase}
                    required
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showOld ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pw-new" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      id="pw-new"
                      name="new_password"
                      type={showNew ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwords.new_password}
                      onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                      className={inputBase}
                      minLength={8}
                      required
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="pw-confirm" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Konfirmasi Baru
                  </label>
                  <div className="relative">
                    <input
                      id="pw-confirm"
                      name="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className={`${inputBase} ${passwordMismatch ? 'border-red-400 focus:border-red-500' : ''}`}
                      minLength={8}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordMismatch && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">Password baru dan konfirmasi tidak cocok.</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingPassword || !passwordFormValid}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 hover:text-primary shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingPassword && <SpinnerGap size={16} className="animate-spin" />}
                  {isSavingPassword ? 'Memperbarui...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* ──── Right Column ──── */}
        <div className="md:col-span-5 space-y-6">

          {/* ═══ CARD 3: Informasi Akses (Read-Only) ═══ */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
              <ShieldCheck size={20} className="text-primary" weight="duotone" />
              <h2 className="text-base font-bold text-gray-900">Informasi Akses</h2>
            </div>

            <div className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Alamat Email</label>
                <input
                  type="email"
                  value={user?.email || '-'}
                  disabled
                  className={inputDisabled}
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Role Sistem</label>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary border border-primary-100 rounded-md text-xs font-black uppercase tracking-wider">
                  <CheckCircle size={14} weight="bold" /> {user?.role?.toUpperCase() || 'USER'}
                </span>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Organisasi</label>
                <div className="flex items-center gap-2">
                  <Buildings size={16} className="text-primary shrink-0" weight="fill" />
                  <input
                    type="text"
                    value={user?.organization_name || user?.organization_id || '-'}
                    disabled
                    className={inputDisabled}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ═══ CARD 4: Tips Keamanan ═══ */}
          <div className="bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-2xl border border-primary/10">
            <h3 className="text-sm font-bold text-primary mb-3">💡 Tips Keamanan</h3>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Gunakan password minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Jangan gunakan password yang sama dengan akun lain.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                Perbarui password secara berkala untuk menjaga keamanan akun.
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
