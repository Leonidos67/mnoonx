import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { profilePath } from '../constants/paths';

import { USERS_API as API_URL, MESSAGES_API } from '../config/api';
import { useTranslation } from '../i18n/useTranslation';

interface DirectoryUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  followersCount: number;
  isSelf: boolean;
}

const Users: React.FC = () => {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingId, setMessagingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      params.set('limit', '100');
      const res = await fetch(`${API_URL}/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token, query]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  const startMessage = async (username: string) => {
    if (!token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
      return;
    }
    setMessagingId(username);
    try {
      const res = await fetch(`${MESSAGES_API}/dm/${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/messenger?chat=${data.conversationId}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMessagingId(null);
    }
  };

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-neutral-600">
        <p>{t('users.signIn')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold text-neutral-900">{t('users.membersTitle')}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t('users.subtitle')}</p>

      <div className="relative mt-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('users.searchPlaceholder')}
          className="w-full rounded-xl border border-neutral-200 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      ) : users.length === 0 ? (
        <p className="py-16 text-center text-neutral-500">{t('users.noUsers')}</p>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {users.map((u) => (
            <li key={u.id} className="flex items-center gap-4 px-4 py-4">
              <img
                src={
                  u.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName)}&background=000&color=fff&bold=true`
                }
                alt=""
                className="h-12 w-12 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-neutral-900">{u.fullName}</p>
                <p className="text-sm text-neutral-500">@{u.username}</p>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {t('users.followersCount', { count: u.followersCount.toLocaleString() })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => navigate(profilePath(u.username))}
                  className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  {t('users.profile')}
                </button>
                {!u.isSelf && u.username !== user?.username && (
                  <button
                    type="button"
                    disabled={messagingId === u.username}
                    onClick={() => void startMessage(u.username)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#315efb] px-3 py-2 text-sm font-medium text-white hover:bg-[#2547c4] disabled:opacity-60"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {messagingId === u.username ? t('users.opening') : t('users.message')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Users;
