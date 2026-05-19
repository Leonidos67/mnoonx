import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUnreads } from '../context/UnreadsContext';

import { NOTIFICATIONS_API as API_URL } from '../config/api';

interface NotificationActor {
  username: string;
  fullName: string;
  avatar?: string;
}

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
  actor?: NotificationActor | null;
}

type Tab = 'mentions' | 'all';

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const day = startOfDay(d);
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (day.getTime() === today.getTime()) {
    return `Today, ${time}`;
  }
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (day >= weekAgo) {
    return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupKey(iso: string): 'today' | 'week' | 'earlier' {
  const d = new Date(iso);
  const now = new Date();
  const today = startOfDay(now);
  const day = startOfDay(d);
  if (day.getTime() === today.getTime()) return 'today';
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  if (day >= weekAgo) return 'week';
  return 'earlier';
}

const SECTION_LABELS: Record<string, string> = {
  today: 'Today',
  week: 'THIS WEEK',
  earlier: 'EARLIER',
};

const Notifications: React.FC = () => {
  const { token } = useAuth();
  const { mentionUnread, refreshUnreads } = useUnreads();
  const [tab, setTab] = useState<Tab>('all');
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
      const res = await fetch(`${API_URL}?tab=${tab}`, {
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
  }, [token, tab]);

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

  const grouped = useMemo(() => {
    const order: Array<'today' | 'week' | 'earlier'> = ['today', 'week', 'earlier'];
    const map: Record<string, NotificationItem[]> = { today: [], week: [], earlier: [] };
    for (const n of items) {
      map[groupKey(n.createdAt)].push(n);
    }
    return order
      .filter((k) => map[k].length > 0)
      .map((k) => ({ key: k, label: SECTION_LABELS[k], items: map[k] }));
  }, [items]);

  const avatarFor = (n: NotificationItem) => {
    if (n.actor?.avatar) return n.actor.avatar;
    const name = n.actor?.fullName || n.title || 'N';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000&color=fff&bold=true`;
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-neutral-600">
        <p>Sign in to view notifications.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full p-4">
      <h1 className="text-xl font-semibold text-neutral-800">Notifications</h1>

      <div className="mt-6 flex gap-8 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setTab('mentions')}
          className={`relative pb-3 text-[15px] font-medium transition-colors ${
            tab === 'mentions' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Mentions
          {mentionUnread > 0 && (
            <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#e5484d] px-1.5 text-[11px] font-bold text-white">
              {mentionUnread > 99 ? '99+' : mentionUnread}
            </span>
          )}
          {tab === 'mentions' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`relative pb-3 text-[15px] font-medium transition-colors ${
            tab === 'all' ? 'text-neutral-900' : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          All activity
          {tab === 'all' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      ) : grouped.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">No notifications yet.</p>
      ) : (
        <div className="mt-2">
          {grouped.map((section) => (
            <div key={section.key} className="mb-6">
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-xs font-semibold tracking-wide text-neutral-400">
                  {section.label}
                </span>
                <div className="h-px flex-1 bg-neutral-200" />
              </div>
              <ul className="divide-y divide-neutral-100">
                {section.items.map((n) => {
                  const inner = (
                    <div className="flex items-start gap-3 py-4">
                      {!n.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-neutral-900" />
                      )}
                      {n.read && <span className="mt-2 h-2 w-2 shrink-0" />}
                      <img
                        src={avatarFor(n)}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-snug text-neutral-900">
                          <span className="font-semibold">{n.title}</span>
                          {n.body ? (
                            <span className="font-normal text-neutral-600"> {n.body}</span>
                          ) : null}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-neutral-400">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>
                  );
                  return (
                    <li key={n._id}>
                      {n.link ? (
                        <Link
                          to={n.link}
                          onClick={() => !n.read && void markRead(n._id)}
                          className="block hover:bg-neutral-50/80"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => !n.read && void markRead(n._id)}
                          className="block w-full text-left hover:bg-neutral-50/80"
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
