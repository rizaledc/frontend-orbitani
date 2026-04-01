import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, SignOut, List, X, Sun, Moon, UserCircle } from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import toast from 'react-hot-toast';

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast.success('Berhasil logout.');
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Peta Lahan';
    if (location.pathname === '/chat') return 'Pakar Agronomi AI';
    return 'Dashboard';
  };

  return (
    <header className="bg-primary text-white h-16 flex items-center justify-between px-4 lg:px-6 shadow-lg z-50 relative glass-panel !bg-primary/95 !border-b-white/10">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          {sidebarOpen ? <X size={20} /> : <List size={20} />}
        </button>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white/15 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <Leaf size={20} className="text-accent" weight="fill" />
          </div>
          <span className="text-lg font-bold tracking-tight hidden sm:block">Orbitani</span>
        </Link>
      </div>

      {/* Center */}
      <h1 className="text-sm font-medium text-white/80 absolute left-1/2 -translate-x-1/2 hidden md:block">
        {getPageTitle()}
      </h1>

      {/* Right */}
      <div className="flex items-center gap-2 lg:gap-4">
        {/* Dynamic User Profile with Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className="hidden md:flex items-center gap-3 pr-4 border-r border-white/20 hover:opacity-80 transition-opacity text-left"
          >
            <div>
              <p className="text-sm font-semibold leading-tight">{user?.username || 'Guest'}</p>
              <p className="text-xs text-white/70 capitalize">{user?.role || 'User'}</p>
            </div>
            <UserCircle size={32} weight="fill" className="text-accent" />
          </button>
          
          {/* Profile Modal/Dropdown */}
          {showProfile && (
            <div className="absolute top-12 right-4 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 text-gray-800 z-50 animate-fade-in shadow-xl shadow-black/10">
              <h3 className="font-bold text-lg mb-2 border-b pb-2 flex items-center justify-between">
                Profil Saya
                <button onClick={() => setShowProfile(false)}><X size={16} className="text-gray-400 hover:text-red-500"/></button>
              </h3>
              
              {user?.role === 'user' ? (
                <div className="space-y-2 text-sm mt-3">
                  <div><span className="text-xs text-gray-400 block uppercase">Username</span> <span className="font-semibold">{user?.username}</span></div>
                  <div><span className="text-xs text-gray-400 block uppercase">Nama Lengkap</span> <span className="font-semibold">{user?.name || '-'}</span></div>
                  <div><span className="text-xs text-gray-400 block uppercase">Email Terdaftar</span> <span className="font-semibold">{user?.email || '-'}</span></div>
                </div>
              ) : (
                <div className="space-y-2 text-sm mt-3">
                  <div><span className="text-xs text-gray-400 block uppercase">Username</span> <span className="font-semibold">{user?.username}</span></div>
                  <div><span className="text-xs text-gray-400 block uppercase">Pangkat / Role</span> <span className="font-semibold uppercase text-primary">{user?.role}</span></div>
                  <div><span className="text-xs text-gray-400 block uppercase">Deskripsi Jabatan</span> <span className="font-medium italic text-gray-600">{user?.description || 'Tidak ada deskripsi spesifik.'}</span></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          <SignOut size={20} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
