import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  GripVertical,
  Headphones,
  Mail,
  Search,
} from 'lucide-react';
import { ADMIN_API } from '../../config/api';
import { adminAuthHeaders, useAdminAuth } from '../../context/AdminAuthContext';
import { profilePath } from '../../constants/paths';
import { formatRelativeTimeRu, formatUsd } from '../../utils/adminFormat';

const PAGE_SIZE = 25;

interface AdminUserRow {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  status: string;
  country: string;
  location: string;
  totalSpend: number;
  joinedAt: string;
  lastAccessedAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  communitiesOwned: number;
  communitiesJoined: number;
  isBulkSeed: boolean;
}

type SortKey = 'createdAt' | 'lastSeen' | 'postsCount' | 'username';

function displayName(row: AdminUserRow): string {
  return row.fullName?.trim() || row.username;
}

function avatarUrl(row: AdminUserRow): string {
  if (row.avatar) return row.avatar;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName(row))}&background=5d6472&color=fff&size=80&bold=true`;
}

const HeaderCell: React.FC<{ label: string; sortIcon?: React.ReactNode }> = ({ label, sortIcon }) => (
  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {label}
      {sortIcon}
      <GripVertical className="h-3.5 w-3.5 text-neutral-600" aria-hidden />
    </span>
  </th>
);

const statusClass = (status: string) => {
  if (status === 'Онлайн') return 'bg-emerald-500/15 text-emerald-300';
  if (status === 'Активен') return 'bg-sky-500/15 text-sky-300';
  return 'bg-white/5 text-neutral-400';
};

const AdminUsers: React.FC = () => {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const t = window.setTimeout(() => setSearchDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sort: sortKey,
        dir: sortDir,
      });
      if (searchDebounced) params.set('search', searchDebounced);

      const res = await fetch(`${ADMIN_API}/users?${params}`, {
        headers: adminAuthHeaders(token),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || 'Не удалось загрузить пользователей');
        setUsers([]);
        setTotal(0);
        return;
      }
      setUsers(Array.isArray(data.users) ? data.users : []);
      setTotal(typeof data.total === 'number' ? data.total : 0);
    } catch {
      setError('Не удалось загрузить пользователей');
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, page, searchDebounced, sortKey, sortDir]);

  useEffect(() => {
    setPage(0);
  }, [searchDebounced, sortKey, sortDir]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const rangeStart = total === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min((safePage + 1) * PAGE_SIZE, total);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleExport = useCallback(() => {
    const header = [
      'User',
      'Username',
      'Email',
      'Status',
      'Country',
      'Total spend',
      'Joined at',
      'Last accessed',
      'Posts',
      'Followers',
      'Communities owned',
      'Communities joined',
      'Bulk seed',
    ];
    const lines = users.map((row) =>
      [
        displayName(row),
        row.username,
        row.email,
        row.status,
        row.country || row.location || '',
        formatUsd(row.totalSpend ?? 0),
        row.joinedAt,
        row.lastAccessedAt,
        row.postsCount,
        row.followersCount,
        row.communitiesOwned,
        row.communitiesJoined,
        row.isBulkSeed ? 'yes' : 'no',
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mnoonx-users.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [users]);

  const bulkOnPage = useMemo(() => users.filter((u) => u.isBulkSeed).length, [users]);

  return (
    <div className="mx-auto max-w-[1400px]">
      <h1 className="text-2xl font-bold text-white">Пользователи</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Все зарегистрированные аккаунты платформы · всего {total}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, username…"
            className="w-full rounded-xl border border-white/10 bg-[#141820] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:border-violet-500/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={users.length === 0}
          className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-neutral-300 hover:bg-white/5 disabled:opacity-40"
        >
          Экспорт CSV (страница)
        </button>
      </div>

      {bulkOnPage > 0 ? (
        <p className="mt-3 text-xs text-amber-400/90">
          На странице bulk-аккаунтов: {bulkOnPage}
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#141820]">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-600 border-t-violet-400" />
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-400">{error}</p>
        ) : total === 0 ? (
          <p className="py-20 text-center text-sm text-neutral-500">Пользователи не найдены</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <HeaderCell label="Пользователь" />
                  <HeaderCell label="Email" />
                  <HeaderCell label="Статус" />
                  <HeaderCell label="Страна" />
                  <HeaderCell
                    label="Потрачено"
                    sortIcon={<ArrowUpDown className="h-3.5 w-3.5 text-neutral-500" aria-hidden />}
                  />
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
                    <button
                      type="button"
                      onClick={() => toggleSort('createdAt')}
                      className="inline-flex items-center gap-1.5 hover:text-neutral-300"
                    >
                      Регистрация
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          sortKey === 'createdAt' && sortDir === 'asc' ? 'rotate-180' : ''
                        }`}
                      />
                      <GripVertical className="h-3.5 w-3.5 text-neutral-600" aria-hidden />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
                    <button
                      type="button"
                      onClick={() => toggleSort('lastSeen')}
                      className="inline-flex items-center gap-1.5 hover:text-neutral-300"
                    >
                      Последний визит
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${
                          sortKey === 'lastSeen' && sortDir === 'asc' ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
                    <button type="button" onClick={() => toggleSort('postsCount')} className="inline-flex items-center gap-1.5 hover:text-neutral-300">
                      Посты
                    </button>
                  </th>
                  <HeaderCell label="Подписчики" />
                  <HeaderCell label="Сообщества" />
                  <HeaderCell label="Контакт" />
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-4 py-4">
                      <a
                        href={profilePath(row.username)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <img src={avatarUrl(row)} alt="" className="h-10 w-10 rounded-full object-cover" />
                        <div>
                          <span className="font-medium text-neutral-100">{displayName(row)}</span>
                          <p className="text-xs text-neutral-500">
                            @{row.username}
                            {row.isBulkSeed ? (
                              <span className="ml-1.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300">
                                bulk
                              </span>
                            ) : null}
                          </p>
                        </div>
                      </a>
                    </td>
                    <td className="px-4 py-4 text-neutral-400">{row.email || '—'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${statusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-neutral-400">{row.country || row.location || '—'}</td>
                    <td className="px-4 py-4 text-neutral-400">{formatUsd(row.totalSpend ?? 0)}</td>
                    <td className="px-4 py-4 text-neutral-500">{formatRelativeTimeRu(row.joinedAt)}</td>
                    <td className="px-4 py-4 text-neutral-500">
                      {formatRelativeTimeRu(row.lastAccessedAt || row.joinedAt)}
                    </td>
                    <td className="px-4 py-4 text-neutral-400">{row.postsCount}</td>
                    <td className="px-4 py-4 text-neutral-400">{row.followersCount}</td>
                    <td className="px-4 py-4 text-neutral-400">
                      {row.communitiesOwned} / {row.communitiesJoined}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to="/admin/support"
                          state={{ userId: row.id }}
                          className="text-neutral-500 hover:text-violet-300"
                          title="Поддержка"
                        >
                          <Headphones className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                        </Link>
                        {row.email ? (
                          <a
                            href={`mailto:${row.email}`}
                            className="text-neutral-500 hover:text-violet-300"
                            title="Email"
                          >
                            <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                          </a>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
            <p className="text-sm text-neutral-500">
              {rangeStart}–{rangeEnd} из {total}
            </p>
            <div className="flex items-center gap-1">
              <PaginationBtn disabled={safePage === 0} onClick={() => setPage(0)} label="В начало">
                <ChevronsLeft className="h-4 w-4" />
              </PaginationBtn>
              <PaginationBtn disabled={safePage === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} label="Назад">
                <ChevronLeft className="h-4 w-4" />
              </PaginationBtn>
              <PaginationBtn
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                label="Вперёд"
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationBtn>
              <PaginationBtn disabled={safePage >= totalPages - 1} onClick={() => setPage(totalPages - 1)} label="В конец">
                <ChevronsRight className="h-4 w-4" />
              </PaginationBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PaginationBtn: React.FC<{
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ disabled, onClick, label, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-label={label}
    className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-white/5 disabled:opacity-30"
  >
    {children}
  </button>
);

export default AdminUsers;
