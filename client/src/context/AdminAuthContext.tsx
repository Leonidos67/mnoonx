import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ADMIN_API } from '../config/api';

const STORAGE_KEY = 'mnoonx_admin_token';

interface AdminAuthContextValue {
  token: string | null;
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionStorage.getItem(STORAGE_KEY)));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUsername(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${ADMIN_API}/session`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('invalid');
        const data = await res.json();
        if (!cancelled) setUsername(data.username || null);
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
        if (!cancelled) {
          setToken(null);
          setUsername(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = useCallback(async (user: string, password: string) => {
    const res = await fetch(`${ADMIN_API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as { message?: string }).message || 'Ошибка входа');
    }
    const nextToken = (data as { token: string }).token;
    sessionStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUsername((data as { username?: string }).username || user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ token, username, loading, login, logout }),
    [token, username, loading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export function adminAuthHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
