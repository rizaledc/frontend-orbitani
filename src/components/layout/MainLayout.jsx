import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-neutral dark:bg-gray-900 overflow-hidden font-sans">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} sidebarOpen={sidebarOpen} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-auto bg-gradient-to-br from-neutral to-emerald-50/30 dark:from-gray-900 dark:to-teal-900/10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
