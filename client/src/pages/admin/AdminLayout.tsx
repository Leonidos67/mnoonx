import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from '../../components/Admin/AdminSidebar';

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen max-h-dvh overflow-hidden bg-[#0b0d12] text-neutral-100">
      <AdminSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b0d12]/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-neutral-300 hover:bg-white/5"
            aria-label="Открыть меню"
          >
            <Menu size={22} />
          </button>
          <span className="text-sm font-semibold text-white">Админ-панель</span>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
