import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Headphones, LayoutDashboard, LogOut, ScrollText, Users, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface AdminSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-violet-600/20 text-violet-200'
      : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-100'
  }`;

const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { username, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const nav = (
    <>
      <div className="mb-8 flex items-center justify-between gap-2 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/90">MNOONX</p>
          <p className="text-lg font-bold text-white">Админ-панель</p>
          {username ? <p className="mt-1 text-xs text-neutral-500">@{username}</p> : null}
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-lg p-2 text-neutral-400 hover:bg-white/5 lg:hidden"
          aria-label="Закрыть меню"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        <NavLink to="/admin" end className={linkClass} onClick={onCloseMobile}>
          <LayoutDashboard size={18} />
          Обзор системы
        </NavLink>
        <NavLink to="/admin/users" className={linkClass} onClick={onCloseMobile}>
          <Users size={18} />
          Пользователи
        </NavLink>
        <NavLink to="/admin/logs" className={linkClass} onClick={onCloseMobile}>
          <ScrollText size={18} />
          Логи БД
        </NavLink>
        <NavLink to="/admin/support" className={linkClass} onClick={onCloseMobile}>
          <Headphones size={18} />
          Поддержка
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={18} />
          Выйти
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Закрыть меню"
          onClick={onCloseMobile}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full max-h-dvh w-[260px] shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-[#11141c] p-5 transition-transform lg:static lg:max-h-none lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {nav}
      </aside>
    </>
  );
};

export default AdminSidebar;
