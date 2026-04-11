import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 overflow-hidden font-sans">
      {/* ──── Top Navigation ──── */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      {/* ──── Content area: Sidebar + Main ──── */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content — the "80% white" canvas */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 custom-scrollbar relative z-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
