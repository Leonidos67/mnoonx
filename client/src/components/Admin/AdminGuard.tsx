import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen max-h-dvh items-center justify-center overflow-y-auto bg-[#0b0d12] text-neutral-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default AdminGuard;
