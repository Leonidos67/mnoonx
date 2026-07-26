import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { communityPath } from '../../constants/communityRoutes';
import {
  canAccessCommunityDashboard,
  canManageCommunitySettings,
} from '../../utils/communityRoles';

import { COMMUNITIES_API as API_URL } from '../../config/api';

interface RequireCommunityOwnerProps {
  children: React.ReactNode;
}

const RequireCommunityOwner: React.FC<RequireCommunityOwnerProps> = ({ children }) => {
  const { handle: handleParam } = useParams<{ handle: string }>();
  const handle = handleParam?.toLowerCase() || '';
  const { token, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading');

  const verify = useCallback(async () => {
    if (!handle) {
      navigate('/discover', { replace: true });
      return;
    }
    if (!token || !user) {
      setStatus('denied');
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    setStatus('loading');
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) {
        navigate('/discover', { replace: true });
        return;
      }
      if (!res.ok) {
        setStatus('denied');
        return;
      }
      const data = await res.json();
      const isDashboardRoute = location.pathname.startsWith('/dashboard/');
      const allowed = isDashboardRoute
        ? canAccessCommunityDashboard(data)
        : canManageCommunitySettings(data, user.id);
      if (!allowed) {
        navigate(communityPath(handle), { replace: true });
        setStatus('denied');
        return;
      }
      setStatus('allowed');
    } catch {
      setStatus('denied');
    }
  }, [handle, token, user, navigate, location.pathname]);

  useEffect(() => {
    if (authLoading) return;
    void verify();
  }, [authLoading, verify]);

  if (authLoading || status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">Sign in required</p>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          Only the community owner or an admin with dashboard access can open this page.
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
          className="mt-6 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Sign in
        </button>
        <Link to={communityPath(handle)} className="mt-4 text-sm font-medium text-[#315efb] hover:underline">
          Back to community
        </Link>
      </div>
    );
  }

  if (status !== 'allowed') {
    return null;
  }

  return <>{children}</>;
};

export default RequireCommunityOwner;
