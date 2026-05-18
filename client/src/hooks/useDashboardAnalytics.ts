import { useCallback, useEffect, useState } from 'react';

const API_URL = 'http://localhost:5000/api/communities';

export interface DailyBucket {
  date: string;
  count: number;
}

export interface CumulativeBucket extends DailyBucket {
  total: number;
}

export interface DashboardMembership {
  id: string;
  name: string;
  type: 'community' | 'app';
  appId?: string;
  price: number;
  priceLabel: string;
  billing: string;
  status: string;
  activeUsers: number;
  allTimeRevenue: number;
}

export interface DashboardAnalyticsSummary {
  memberCount: number;
  postCount: number;
  appCount: number;
  totalChatUnread: number;
  estimatedRevenue: number;
  newMembers7d: number;
  newPosts7d: number;
  isPaid: boolean;
  price: number;
}

export interface DashboardAnalyticsData {
  summary: DashboardAnalyticsSummary;
  memberGrowth: DailyBucket[];
  memberGrowthCumulative: CumulativeBucket[];
  postsActivity: DailyBucket[];
  memberships: DashboardMembership[];
}

export function useDashboardAnalytics(handle: string, token: string | null) {
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!handle || !token) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_URL}/${encodeURIComponent(handle)}/dashboard/analytics`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((body as { message?: string }).message || 'Failed to load analytics.');
        setData(null);
        return;
      }
      setData(body as DashboardAnalyticsData);
    } catch {
      setError('Failed to load analytics.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [handle, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function formatChartDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
