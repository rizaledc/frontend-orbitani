import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Leaf,
  SignOut,
  List,
  X,
  UserCircle,
  CaretDown,
  Trash,
} from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  /* Close dropdowns on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Berhasil logout.');
    navigate('/login');
  };

  const PAGE_TITLES = {
    '/dashboard': 'Eksplorasi Lahan',
    '/chat': 'Pakar Agronomi AI',
    '/support': 'Live Chat',
    '/analytics': 'Laporan Analitik',
    '/history': 'Riwayat Data',
    '/users': 'Manajemen Pengguna',
    '/profile': 'Pengaturan Profil',
    '/admin/organizations': 'Manajemen Organisasi',
    '/admin/mlops': 'Dashboard MLOps',
  };

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  /* Avatar initials */
  const initials = (user?.username || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header
      id="main-navbar"
      className="
        h-[72px] flex items-center justify-between px-4 lg:px-6
        bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm
        z-50 relative transition-colors duration-300
      "
    >
      {/* ──── Left ──── */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          id="sidebar-toggle"
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>

        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-primary-50 dark:bg-gray-800 rounded-xl flex items-center justify-center border border-primary-100 dark:border-gray-700 shadow-sm transition-shadow">
            <Leaf size={22} className="text-primary" weight="fill" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight hidden sm:block">
            Orbitani
          </span>
        </Link>

        {/* Separator + Page title — desktop */}
        <div className="hidden md:flex items-center gap-3 ml-4">
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{pageTitle}</span>
        </div>
      </div>

      {/* ──── Right ──── */}
      <div className="flex items-center gap-2">
        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="btn-user-profile"
            onClick={() => setShowProfile(!showProfile)}
            className="
              flex items-center gap-3 p-1.5 pr-3 rounded-xl
              hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200
            "
          >
            {/* Avatar circle */}
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>

            {/* Name + role — desktop */}
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {user?.username || 'Guest'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">
                {user?.role || 'User'}
              </p>
            </div>

            <CaretDown
              size={14}
              className={`hidden md:block text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                showProfile ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Dropdown panel */}
          {showProfile && (
            <div
              id="profile-dropdown"
              className="
                absolute top-full right-0 mt-3 w-72
                bg-white dark:bg-gray-900 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800
                p-2 z-50 animate-fade-in
              "
            >
              {/* Header */}
              <div className="px-4 pt-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-sm font-black">
                    {initials}
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-900 dark:text-white leading-tight">{user?.username || 'Guest'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize mt-0.5">{user?.role || 'user'}</p>
                  </div>
                </div>
              </div>

              {/* Profile info */}
              <div className="px-5 py-4 space-y-3 border-b border-gray-100 dark:border-gray-800">
                {user?.name && (
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Nama Lengkap</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{user.name}</p>
                  </div>
                )}
                {user?.email && (
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Email</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{user.email}</p>
                  </div>
                )}
                {user?.role !== 'user' && user?.description && (
                  <div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-bold">Deskripsi</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">{user.description}</p>
                  </div>
                )}
              </div>

              {/* Profile Actions */}
              <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                <Link
                  to="/profile"
                  onClick={() => setShowProfile(false)}
                  className="
                    w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                    text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-colors
                  "
                >
                  <UserCircle size={20} weight="duotone" />
                  Pengaturan Profil
                </Link>
              </div>

              {/* Logout */}
              <div className="p-2">
                <button
                  id="btn-logout-dropdown"
                  onClick={handleLogout}
                  className="
                    w-full flex items-center gap-3 px-4 py-3 rounded-2xl
                    text-sm font-bold text-danger hover:bg-danger-light dark:hover:bg-red-950/30
                    transition-colors
                  "
                >
                  <SignOut size={20} weight="bold" />
                  Keluar dari akun
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
