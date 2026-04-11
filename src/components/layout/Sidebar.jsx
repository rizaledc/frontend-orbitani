import { NavLink, useLocation } from 'react-router-dom';
import {
  MapTrifold,
  ChatCircleDots,
  Leaf,
  ChartBar,
  FileCsv,
  Users,
  Headset,
  Buildings,
  Cpu,
} from '@phosphor-icons/react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  /* ──── Role resolution with JWT fallback ──── */
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

  /* ──── Menu items with RBAC ──── */
  const menuSections = [
    {
      title: 'Utama',
      items: [
        {
          path: '/dashboard',
          label: 'Eksplorasi Lahan',
          icon: MapTrifold,
          desc: 'Peta & data satelit',
          show: true, // All roles
        },
        {
          path: '/chat',
          label: 'Pakar AI',
          icon: ChatCircleDots,
          desc: 'Konsultasi agronomi',
          show: true, // All roles
        },
        {
          path: '/support',
          label: 'Live Chat',
          icon: Headset,
          desc: 'Chat sesama pengguna',
          show: true, // All roles (Specifically requested for user)
        },
      ],
    },
    {
      title: 'Analisis',
      items: [
        {
          path: '/analytics',
          label: 'Laporan Analitik',
          icon: ChartBar,
          desc: 'Grafik & tren',
          show: role === 'admin' || role === 'superadmin',
        },
        {
          path: '/history',
          label: 'Riwayat Data',
          icon: FileCsv,
          desc: 'Laporan historis',
          show: role === 'admin' || role === 'superadmin',
        },
      ],
    },
    {
      title: 'Admin',
      items: [
        {
          path: '/users',
          label: 'Kelola Pengguna',
          icon: Users,
          desc: 'Manajemen akun staff',
          show: role === 'admin' || role === 'superadmin',
        },
        {
          path: '/admin/organizations',
          label: 'Daftar Organisasi',
          icon: Buildings,
          desc: 'Manajemen tenant',
          show: role === 'superadmin', // Superadmin ONLY
        },
        {
          path: '/admin/mlops',
          label: 'Dashboard MLOps',
          icon: Cpu,
          desc: 'Feedback & Retrain',
          show: role === 'superadmin', // Superadmin ONLY
        },
      ],
    },
  ];

  return (
    <>
      {/* ──── Mobile overlay ──── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* ──── Sidebar container ──── */}
      <aside
        id="main-sidebar"
        className={`
          absolute inset-y-0 left-0 z-40 w-max pr-6 lg:pr-0 max-w-[85vw] lg:min-w-[260px] lg:max-w-xs
          bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-300 ease-out
          lg:static lg:translate-x-0
          flex flex-col transition-colors duration-300
          ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full'}
        `}
      >
        {/* ──── Brand stripe ──── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">

            <div>
              <p className="text-[11px] font-semibold text-primary uppercase tracking-widest">
                Menu Navigasi
              </p>
            </div>
          </div>
        </div>

        {/* ──── Navigation sections ──── */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-5 custom-scrollbar">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.show);
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title}>
                {/* Section label */}
                <p className="px-3 mb-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
                  {section.title}
                </p>

                {/* Menu links */}
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all duration-200 relative
                        ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div
                            className={`
                              w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                              transition-colors duration-200
                              ${
                                isActive
                                  ? 'bg-white/20'
                                  : 'bg-gray-100 dark:bg-gray-800 group-hover:bg-primary-50 dark:group-hover:bg-gray-700'
                              }
                            `}
                          >
                            <item.icon
                              size={18}
                              weight={isActive ? 'fill' : 'duotone'}
                              className={isActive ? 'text-white' : 'text-primary'}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="block leading-tight">{item.label}</span>
                            <span
                              className={`block text-[11px] leading-tight mt-0.5
                                ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}
                              `}
                            >
                              {item.desc}
                            </span>
                          </div>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ──── Footer ──── */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <div className="flex items-center gap-2.5">

            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-primary uppercase">{role}</span>
                <span className="mx-1">·</span>
                Orbitani v2.0
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
