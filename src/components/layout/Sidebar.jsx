import { NavLink } from 'react-router-dom';
import { 
  MapTrifold, 
  ChatCircleDots, 
  Leaf, 
  ChartBar, 
  FileCsv, 
  Users,
  Headset
} from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  // 1. Ambil role dari JWT orbitani_token di localStorage sebagai fallback
  //    atau langsung dari authStore jika tersedia.
  const getRole = () => {
    if (user?.role) return user.role;
    try {
      const token = localStorage.getItem('orbitani_token');
      if (!token) return 'user';
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role || 'user';
    } catch {
      return 'user';
    }
  };

  const role = getRole();

  // 2. Definisi Menu & Kondisi Akses (RBAC)
  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Eksplorasi Lahan', 
      icon: MapTrifold, 
      show: true // Semua user bisa akses
    },
    { 
      path: '/chat', 
      label: 'Pakar AI', 
      icon: ChatCircleDots, 
      show: true // Semua user bisa akses
    },
    { 
      path: '/support', 
      label: 'Pusat Bantuan', 
      icon: Headset, 
      show: true // Semua user bisa chat manusia
    },
    { 
      path: '/analytics', 
      label: 'Laporan Analitik', 
      icon: ChartBar, 
      show: role === 'admin' || role === 'superadmin'
    },
    { 
      path: '/history', 
      label: 'Laporan Historis', 
      icon: FileCsv, 
      show: role === 'admin' || role === 'superadmin'
    },
    { 
      path: '/users', 
      label: 'Manajemen Pengguna', 
      icon: Users, 
      show: role === 'superadmin'
    },
  ];

  return (
    <>
      {/* 3. Overlay Mobile dengan Backdrop Blur */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 z-40 w-64 bg-primary dark:bg-gray-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col shadow-xl border-r border-white/5 dark:border-gray-700
        `}
      >
        {/* Brand Stripe */}
        <div className="px-5 py-5 border-b border-white/10 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <Leaf size={16} className="text-accent" weight="fill" />
            </div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-widest">
              Menu Utama
            </p>
          </div>
        </div>

        {/* Navigation Links (RBAC Filtered) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
          {menuItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-white/15 text-white shadow-md'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} className="flex-shrink-0" weight="duotone" />
                <span>{item.label}</span>
              </NavLink>
            ))}
        </nav>

        {/* Footer info showing current Role for visibility */}
        <div className="px-5 py-4 border-t border-white/10 dark:border-gray-700">
          <p className="text-white/30 text-xs">Orbitani — Role: <span className="uppercase text-accent/80 font-semibold">{role}</span></p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
