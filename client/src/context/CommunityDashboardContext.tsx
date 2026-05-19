import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './AuthContext';
import {
  CommunityAdminPermissions,
  mergeAdminPermissions,
} from '../constants/communityAdminPermissions';
import { canAccessCommunityDashboard } from '../utils/communityRoles';
import { communityPath } from '../constants/communityRoutes';

import { COMMUNITIES_API as API_URL } from '../config/api';

export interface DashboardInstalledApp {
  id: string;
  appId: string;
  title: string;
  visibleToMembers: boolean;
  note?: string;
}

export interface DashboardCommunity {
  _id: string;
  name: string;
  handle: string;
  description: string;
  avatar: string;
  banner: string;
  owner: { _id: string; username: string; fullName: string; avatar: string };
  memberCount: number;
  category: string;
  isPublic: boolean;
  membersCanPost?: boolean;
  joinCode?: string;
  isPaid: boolean;
  price: number;
  isOwner?: boolean;
  isAdmin?: boolean;
  adminPermissions?: CommunityAdminPermissions;
  installedAppInstances?: DashboardInstalledApp[];
}

interface CommunityDashboardContextValue {
  handle: string;
  community: DashboardCommunity | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  setCommunity: React.Dispatch<React.SetStateAction<DashboardCommunity | null>>;
}

const CommunityDashboardContext = createContext<CommunityDashboardContextValue | null>(null);

export const CommunityDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { handle: handleParam } = useParams<{ handle: string }>();
  const handle = handleParam?.toLowerCase() || '';
  const { token } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<DashboardCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!handle) return;
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}`, { headers });
      if (res.status === 404) {
        navigate('/discover');
        return;
      }
      if (!res.ok) {
        setError('Failed to load community.');
        setCommunity(null);
        return;
      }
      const data: DashboardCommunity = await res.json();
      if (!canAccessCommunityDashboard(data)) {
        navigate(communityPath(handle), { replace: true });
        setCommunity(null);
        setError('You do not have access to this dashboard.');
        return;
      }
      if (data.adminPermissions) {
        data.adminPermissions = mergeAdminPermissions(data.adminPermissions);
      }
      setCommunity(data);
    } catch {
      setError('Failed to load community.');
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  }, [handle, token, navigate]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <CommunityDashboardContext.Provider
      value={{ handle, community, loading, error, reload, setCommunity }}
    >
      {children}
    </CommunityDashboardContext.Provider>
  );
};

export function useCommunityDashboard(): CommunityDashboardContextValue {
  const ctx = useContext(CommunityDashboardContext);
  if (!ctx) {
    throw new Error('useCommunityDashboard must be used within CommunityDashboardProvider');
  }
  return ctx;
}
