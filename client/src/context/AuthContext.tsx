// context/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

import { AUTH_API as API_URL } from '../config/api';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  createdAt: string;
  twoFactorEnabled?: boolean;
  welcomeOnboardingCompleted?: boolean;
}

export type LoginResult =
  | { ok: true }
  | { ok: false; requires2fa: true; tempToken: string };

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  complete2faLogin: (tempToken: string, totpCode: string) => Promise<void>;
  register: (username: string, email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const savedToken = localStorage.getItem('token');
      if (!savedToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        });
        if (!res.ok) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!cancelled) {
            setToken(null);
            setUser(null);
          }
          return;
        }
        const data = await res.json();
        if (!cancelled && data.user) {
          setToken(savedToken);
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!cancelled) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyAuth = (nextToken: string, nextUser: User) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('token', nextToken);
    localStorage.setItem('user', JSON.stringify(nextUser));
  };

  const patchUser = (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser));
    else localStorage.removeItem('user');
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Invalid credentials');

    if (data.requires2fa && data.tempToken) {
      return { ok: false, requires2fa: true, tempToken: data.tempToken };
    }

    applyAuth(data.token, data.user);
    return { ok: true };
  };

  const complete2faLogin = async (tempToken: string, totpCode: string) => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, totpCode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Invalid authenticator code');
    applyAuth(data.token, data.user);
  };

  const register = async (username: string, email: string, password: string, fullName: string) => {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, fullName }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Registration failed');

    applyAuth(data.token, data.user);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        complete2faLogin,
        register,
        logout,
        setUser: patchUser,
        isAuthenticated: !!user,
        loading,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
