import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

const API = 'http://localhost:5000/api';

interface UnreadsContextType {
  messageUnread: number;
  notificationUnread: number;
  mentionUnread: number;
  refreshUnreads: () => void;
}

const UnreadsContext = createContext<UnreadsContextType | undefined>(undefined);

export const UnreadsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [messageUnread, setMessageUnread] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [mentionUnread, setMentionUnread] = useState(0);

  const refreshUnreads = useCallback(async () => {
    if (!token) {
      setMessageUnread(0);
      setNotificationUnread(0);
      setMentionUnread(0);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [msgRes, notifRes] = await Promise.all([
        fetch(`${API}/messages/unread-count`, { headers }),
        fetch(`${API}/notifications/unread-count`, { headers }),
      ]);
      if (msgRes.ok) {
        const data = await msgRes.json();
        setMessageUnread(typeof data.count === 'number' ? data.count : 0);
      }
      if (notifRes.ok) {
        const data = await notifRes.json();
        setNotificationUnread(typeof data.all === 'number' ? data.all : 0);
        setMentionUnread(typeof data.mentions === 'number' ? data.mentions : 0);
      }
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    void refreshUnreads();
    if (!token) return;
    const id = window.setInterval(refreshUnreads, 15000);
    return () => clearInterval(id);
  }, [token, refreshUnreads]);

  return (
    <UnreadsContext.Provider
      value={{ messageUnread, notificationUnread, mentionUnread, refreshUnreads }}
    >
      {children}
    </UnreadsContext.Provider>
  );
};

export const useUnreads = (): UnreadsContextType => {
  const ctx = useContext(UnreadsContext);
  if (!ctx) throw new Error('useUnreads must be used within UnreadsProvider');
  return ctx;
};
