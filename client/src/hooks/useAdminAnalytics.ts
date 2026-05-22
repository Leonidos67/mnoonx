import { useCallback, useEffect, useState } from 'react';
import { ADMIN_API } from '../config/api';
import { adminAuthHeaders } from '../context/AdminAuthContext';

export interface DailyBucket {
  date: string;
  count: number;
}

export interface CumulativeBucket extends DailyBucket {
  total: number;
}

export interface AdminAnalyticsSummary {
  usersCount: number;
  communitiesCount: number;
  postsCount: number;
  newUsers7d: number;
  newPosts7d: number;
  newCommunities7d: number;
  activeUsers7d: number;
  needsReplyCount: number;
  bulkUsersCount: number;
}

export interface AdminAnalyticsData {
  summary: AdminAnalyticsSummary;
  userRegistrations: DailyBucket[];
  userRegistrationsCumulative: CumulativeBucket[];
  postsActivity: DailyBucket[];
  communitiesCreated: DailyBucket[];
  messagesActivity: DailyBucket[];
}

export function useAdminAnalytics(token: string | null) {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${ADMIN_API}/analytics`, { headers: adminAuthHeaders(token) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((body as { message?: string }).message || 'Не удалось загрузить аналитику');
        setData(null);
        return;
      }
      setData(body as AdminAnalyticsData);
    } catch {
      setError('Не удалось загрузить аналитику');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
