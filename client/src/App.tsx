// src/App.tsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { UnreadsProvider } from './context/UnreadsContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

import AppLayout from './components/Layout/AppLayout';

import Home from './pages/Home';
import Discover from './pages/Discover';
import CommunityPage from './pages/CommunityPage';

import LoginModal from './components/Auth/LoginModal';
import RegisterModal from './components/Auth/RegisterModal';

import NewPage from './components/Community/New';
import NewPersonal from './components/Community/NewPersonal';
import NewBusiness from './components/Community/NewBusiness';
import Messenger from './pages/Messenger';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import PostPage from './pages/PostPage';
import CreateCommunity from './pages/CreateCommunity';
import CommunitySettings from './pages/CommunitySettings';
import CommunityStore from './pages/CommunityStore';
import CommunityDashboardLayout from './components/Community/Dashboard/CommunityDashboardLayout';
import CommunityDashboardHome from './pages/community-dashboard/CommunityDashboardHome';
import CommunityDashboardSettings from './pages/community-dashboard/CommunityDashboardSettings';
import CommunityDashboardUsers from './pages/community-dashboard/CommunityDashboardUsers';
import CommunityDashboardProducts from './pages/community-dashboard/CommunityDashboardProducts';
import CommunityDashboardContent from './pages/community-dashboard/CommunityDashboardContent';
import CommunityDashboardAnalytics from './pages/community-dashboard/CommunityDashboardAnalytics';
import CommunityDashboardInvites from './pages/community-dashboard/CommunityDashboardInvites';
import Plan from './pages/Plan';
import Activity from './pages/Activity';
import ProfileRoute from './components/Routing/ProfileRoute';
import RequireAuth from './components/Routing/RequireAuth';
import { RequireUsersDirectoryAccess } from './components/Routing/RequireUsername';
import RequireCommunityOwner from './components/Routing/RequireCommunityOwner';
import { COMMUNITY_SETTINGS_SEGMENT, COMMUNITY_STORE_SEGMENT } from './constants/communityRoutes';
import AdminRoutes from './pages/admin/AdminRoutes';
import DocsRoutes from './pages/docs/DocsRoutes';

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    const openLogin = () => setIsLoginOpen(true);
    window.addEventListener('openLogin', openLogin);
    return () => window.removeEventListener('openLogin', openLogin);
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
      <ToastProvider>
      <ConfirmProvider>
      <UnreadsProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/admin/*" element={<AdminRoutes />} />
          <Route path="/docs/*" element={<DocsRoutes />} />

          {/* Основные страницы */}
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          <Route path="/discover" element={<AppLayout><Discover /></AppLayout>} />
          <Route path="/ai" element={<Navigate to="/discover?tab=market" replace />} />
          <Route
            path={`/community/:handle/${COMMUNITY_SETTINGS_SEGMENT}`}
            element={
              <AppLayout>
                <RequireAuth>
                  <RequireCommunityOwner>
                    <CommunitySettings />
                  </RequireCommunityOwner>
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route
            path={`/community/:handle/${COMMUNITY_STORE_SEGMENT}`}
            element={
              <AppLayout>
                <RequireAuth>
                  <RequireCommunityOwner>
                    <CommunityStore />
                  </RequireCommunityOwner>
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route path="/community/:handle" element={<AppLayout><CommunityPage /></AppLayout>} />
          <Route
            path="/dashboard/:handle"
            element={
              <AppLayout>
                <RequireAuth>
                  <RequireCommunityOwner>
                    <CommunityDashboardLayout />
                  </RequireCommunityOwner>
                </RequireAuth>
              </AppLayout>
            }
          >
            <Route index element={<CommunityDashboardHome />} />
            <Route path="settings" element={<CommunityDashboardSettings />} />
            <Route path="users" element={<CommunityDashboardUsers />} />
            <Route path="products" element={<CommunityDashboardProducts />} />
            <Route path="content" element={<CommunityDashboardContent />} />
            <Route path="analytics" element={<CommunityDashboardAnalytics />} />
            <Route path="invites" element={<CommunityDashboardInvites />} />
          </Route>
          <Route path="/create-community" element={<CreateCommunity />} />
          <Route path="/new" element={<AppLayout><NewPage /></AppLayout>} />
          <Route path="/new/personal" element={<AppLayout><NewPersonal /></AppLayout>} />
          <Route path="/new/business" element={<AppLayout><NewBusiness /></AppLayout>} />
          <Route path="/messenger" element={<AppLayout><Messenger /></AppLayout>} />
          <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
          <Route
            path="/users"
            element={
              <AppLayout>
                <RequireUsersDirectoryAccess>
                  <Users />
                </RequireUsersDirectoryAccess>
              </AppLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <AppLayout>
                <RequireAuth>
                  <Settings />
                </RequireAuth>
              </AppLayout>
            }
          />
          <Route path="/plan" element={<AppLayout><Plan /></AppLayout>} />
          <Route
            path="/activity"
            element={
              <AppLayout>
                <RequireAuth>
                  <Activity />
                </RequireAuth>
              </AppLayout>
            }
          />

          <Route path="/post/:postId" element={<PostPage />} />

          {/* /@username или редирект с /username (см. ProfileRoute) */}
          <Route path="/:username" element={<ProfileRoute />} />
          
          {/* Страница 404 для всего остального */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <LoginModal 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
          onSwitchToRegister={() => {
            setIsLoginOpen(false);
            setIsRegisterOpen(true);
          }} 
        />

        <RegisterModal 
          isOpen={isRegisterOpen} 
          onClose={() => setIsRegisterOpen(false)} 
          onSwitchToLogin={() => {
            setIsRegisterOpen(false);
            setIsLoginOpen(true);
          }} 
        />
      </Router>
      </UnreadsProvider>
      </ConfirmProvider>
      </ToastProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;