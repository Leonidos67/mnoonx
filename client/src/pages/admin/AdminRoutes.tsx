import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from '../../context/AdminAuthContext';
import AdminGuard from '../../components/Admin/AdminGuard';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminSupport from './AdminSupport';
import AdminUsers from './AdminUsers';
import AdminLogs from './AdminLogs';
import AdminModeration from './AdminModeration';

const AdminRoutes: React.FC = () => (
  <AdminAuthProvider>
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="support" element={<AdminSupport />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </AdminAuthProvider>
);

export default AdminRoutes;
