import { useCallback, useEffect, useState } from 'react';

import { COMMUNITIES_API as API_URL } from '../config/api';

export interface DashboardOverview {
  postCount: number;
  totalChatUnread: number;
  unreadByChatInstance: Record<string, number>;
  loading: boolean;
}

export function useDashboardOverview(handle: string, token: string | null): DashboardOverview {
  const [postCount, setPostCount] = useState(0);
  const [totalChatUnread, setTotalChatUnread] = useState(0);
  const [unreadByChatInstance, setUnreadByChatInstance] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!handle || !token) {
      setPostCount(0);
      setTotalChatUnread(0);
      setUnreadByChatInstance({});
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [postsRes, unreadRes] = await Promise.all([
        fetch(`${API_URL}/${encodeURIComponent(handle)}/posts`, { headers }),
        fetch(`${API_URL}/${encodeURIComponent(handle)}/chat/unread`, { headers }),
      ]);

      if (postsRes.ok) {
        const posts = await postsRes.json();
        setPostCount(Array.isArray(posts) ? posts.length : 0);
      } else {
        setPostCount(0);
      }

      if (unreadRes.ok) {
        const data = (await unreadRes.json()) as { counts?: Record<string, number> };
        const counts = data.counts ?? {};
        setUnreadByChatInstance(counts);
        setTotalChatUnread(
          Object.values(counts).reduce((sum, n) => sum + (typeof n === 'number' ? n : 0), 0)
        );
      } else {
        setUnreadByChatInstance({});
        setTotalChatUnread(0);
      }
    } catch {
      setPostCount(0);
      setTotalChatUnread(0);
      setUnreadByChatInstance({});
    } finally {
      setLoading(false);
    }
  }, [handle, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { postCount, totalChatUnread, unreadByChatInstance, loading };
}
