import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreads } from '../context/UnreadsContext';
import { NOTIFICATIONS_API as API_URL } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';
import {
  NotificationFeed,
  NotificationItem,
} from '../components/Notifications/NotificationFeed';

const NotificationsEngagement: React.FC = () => {
  const { token } = useAuth();
  const { refreshUnreads } = useUnreads();
  const { t } = useTranslation();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}?tab=engagement`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    if (!token) return;
    await fetch(`${API_URL}/${id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    refreshUnreads();
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-neutral-600">
        <p>{t('notifications.signIn')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full">
      <div className="flex items-center gap-2 px-2 pt-3 sm:px-4">
        <Link
          to="/notifications"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-800 transition-colors hover:bg-black/5 active:scale-95"
          aria-label={t('notifications.backToNotificationsAria')}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Link>
        <h1 className="min-w-0 truncate text-xl font-semibold text-neutral-800">
          {t('notifications.engagementBlockTitlePage')}
        </h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      ) : (
        <NotificationFeed
          items={items}
          emptyLabel={t('notifications.engagementEmpty')}
          onMarkRead={(id) => void markRead(id)}
          t={t}
        />
      )}
    </div>
  );
};

export default NotificationsEngagement;
