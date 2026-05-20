import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COMMUNITIES_API } from '../config/api';

export interface MyCommunity {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
  memberCount?: number;
}

export function useMyCommunities(enabled = true) {
  const { token } = useAuth();
  const [communities, setCommunities] = useState<MyCommunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setCommunities([]);
      setLoaded(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${COMMUNITIES_API}/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCommunities([]);
        return;
      }
      const data = await res.json();
      setCommunities(Array.isArray(data) ? data : []);
    } catch {
      setCommunities([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    if (enabled && !loaded) {
      void load();
    }
  }, [enabled, loaded, load]);

  return { communities, loading, loaded, reload: load };
}
