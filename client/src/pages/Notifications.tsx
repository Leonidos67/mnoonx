import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUnreads } from '../context/UnreadsContext';
import { NOTIFICATIONS_API as API_URL } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';
import {
  NotificationFeed,
  NotificationItem,
} from '../components/Notifications/NotificationFeed';

export const NOTIFICATIONS_ENGAGEMENT_PATH = '/notifications/engagement';

const Notifications: React.FC = () => {
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
      const res = await fetch(`${API_URL}?tab=all`, {
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

  const engagementItems = useMemo(
    () => items.filter((n) => n.type === 'engagement'),
    [items]
  );
  const otherItems = useMemo(
    () => items.filter((n) => n.type !== 'engagement'),
    [items]
  );

  const latestEngagement = engagementItems[0] || null;
  const unreadEngagementInList = engagementItems.filter((n) => !n.read).length;

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-neutral-600">
        <p>{t('notifications.signIn')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full">
      <h1 className="px-4 pt-4 text-xl font-semibold text-neutral-800">
        {t('notifications.title')}
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      ) : (
        <div className="mt-2">
          <Link
            to={NOTIFICATIONS_ENGAGEMENT_PATH}
            className="flex w-full items-center gap-3 px-0 py-4 text-left hover:bg-neutral-50/80"
          >
            <span
              className={`w-2 -ml-1 shrink-0 rounded-full transition-all duration-200 ease-out ${
                unreadEngagementInList > 0 ? 'h-8 bg-black' : 'h-0 bg-transparent'
              }`}
              aria-hidden
            />
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
              <Heart className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold leading-snug text-neutral-900">
                <span className="lg:hidden">{t('notifications.engagementBlockTitlePage')}</span>
                <span className="hidden lg:inline">{t('notifications.engagementBlockTitle')}</span>
              </p>
              <p className="mt-0.5 text-sm text-neutral-500">
                {unreadEngagementInList > 0
                  ? t('notifications.engagementUnread', { count: unreadEngagementInList })
                  : latestEngagement?.body || t('notifications.engagementBlockHint')}
              </p>
            </div>
            <ChevronRight
              className="mr-4 h-5 w-5 shrink-0 text-neutral-400"
              aria-hidden
            />
          </Link>

          {otherItems.length === 0 && engagementItems.length === 0 ? (
            <p className="py-16 text-center text-neutral-500">{t('notifications.empty')}</p>
          ) : otherItems.length > 0 ? (
            <NotificationFeed
              items={otherItems}
              emptyLabel={t('notifications.empty')}
              onMarkRead={(id) => void markRead(id)}
              t={t}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Notifications;
