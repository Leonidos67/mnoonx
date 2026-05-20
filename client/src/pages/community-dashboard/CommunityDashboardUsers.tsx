import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Mail,
  Upload,
  Settings,
  GripVertical,
  ArrowUpDown,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import { profilePath } from '../../constants/paths';
import {
  formatUsd,
  useDashboardAnalytics,
  type DashboardMembership,
} from '../../hooks/useDashboardAnalytics';
import { communityDashboardSettingsPath } from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';

import { COMMUNITIES_API as API_URL } from '../../config/api';
const PAGE_SIZE = 25;

interface MemberRow {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  status: string;
  role: string;
  joinedAt: string;
  lastAccessedAt?: string;
  totalSpend?: number;
}

type UsersTab = 'users' | 'memberships';
type SortKey = 'joinedAt' | 'totalSpend';

function displayName(row: MemberRow): string {
  return row.fullName?.trim() || row.username;
}

function avatarUrl(row: MemberRow): string {
  if (row.avatar) return row.avatar;
  const label = displayName(row);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=5d6472&color=fff&size=80&bold=true`;
}

const HeaderCell: React.FC<{
  label: string;
  sortIcon?: React.ReactNode;
}> = ({ label, sortIcon }) => (
  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {label}
      {sortIcon}
      <GripVertical className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
    </span>
  </th>
);

const MembershipsPanel: React.FC<{
  memberships: DashboardMembership[];
  loading: boolean;
  error: string | null;
  handle: string;
}> = ({ memberships, loading, error, handle }) => {
  const { t } = useTranslation();

  const statusLabel = (status: string) => {
    if (status === 'Hidden') return t('communityDashboard.hidden');
    if (status === 'Visible') return t('communityDashboard.visible');
    return status;
  };

  if (loading) {
    return (
      <div className="flex flex-1 justify-center bg-white py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="mx-8 mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </p>
    );
  }
  if (memberships.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-neutral-500">
        {t('communityDashboard.users.noMembershipsConfigured')}{' '}
        <Link to={communityDashboardSettingsPath(handle)} className="text-[#315efb] hover:underline">
          {t('communityDashboard.users.monetizationSettings')}
        </Link>
      </p>
    );
  }
  return (
    <div className="flex-1 overflow-x-auto bg-white">
      <table className="w-full min-w-[880px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            <HeaderCell label={t('communityDashboard.users.colProduct')} />
            <HeaderCell label={t('communityDashboard.users.colType')} />
            <HeaderCell label={t('communityDashboard.users.colPrice')} />
            <HeaderCell label={t('communityDashboard.users.colBilling')} />
            <HeaderCell label={t('communityDashboard.users.colStatus')} />
            <HeaderCell label={t('communityDashboard.users.colActiveUsers')} />
            <HeaderCell label={t('communityDashboard.users.colAllTimeRevenue')} />
          </tr>
        </thead>
        <tbody>
          {memberships.map((row) => (
            <tr key={row.id} className="border-b border-neutral-100 last:border-0">
              <td className="px-4 py-4 font-medium text-neutral-900">{row.name}</td>
              <td className="px-4 py-4 capitalize text-neutral-600">{row.type}</td>
              <td className="px-4 py-4 text-neutral-700">{row.priceLabel}</td>
              <td className="px-4 py-4 text-neutral-600">{row.billing}</td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                    row.status === 'Hidden'
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {statusLabel(row.status)}
                </span>
              </td>
              <td className="px-4 py-4 text-neutral-700">{row.activeUsers}</td>
              <td className="px-4 py-4 text-neutral-700">{formatUsd(row.allTimeRevenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CommunityDashboardUsers: React.FC = () => {
  const { handle } = useCommunityDashboard();
  const { token } = useAuth();
  const { t } = useTranslation();

  const formatRelativeTime = useCallback(
    (iso: string): string => {
      if (!iso) return '—';
      const then = new Date(iso).getTime();
      if (Number.isNaN(then)) return '—';
      const seconds = Math.floor((Date.now() - then) / 1000);
      if (seconds < 60) return t('communityDashboard.users.justNow');
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) {
        return t(
          minutes === 1 ? 'communityDashboard.users.minutesAgo' : 'communityDashboard.users.minutesAgoMany',
          { count: minutes }
        );
      }
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return t(
          hours === 1 ? 'communityDashboard.users.hoursAgo' : 'communityDashboard.users.hoursAgoMany',
          { count: hours }
        );
      }
      const days = Math.floor(hours / 24);
      if (days < 30) {
        return t(
          days === 1 ? 'communityDashboard.users.daysAgo' : 'communityDashboard.users.daysAgoMany',
          { count: days }
        );
      }
      const months = Math.floor(days / 30);
      if (months < 12) {
        return t(
          months === 1 ? 'communityDashboard.users.monthsAgo' : 'communityDashboard.users.monthsAgoMany',
          { count: months }
        );
      }
      const years = Math.floor(months / 12);
      return t(
        years === 1 ? 'communityDashboard.users.yearsAgo' : 'communityDashboard.users.yearsAgoMany',
        { count: years }
      );
    },
    [t]
  );
  const {
    data: analyticsData,
    loading: analyticsLoading,
    error: analyticsError,
  } = useDashboardAnalytics(handle, token);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<UsersTab>('users');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('joinedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    if (!handle || !token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/${encodeURIComponent(handle)}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || t('communityDashboard.users.loadFailed'));
        setMembers([]);
        return;
      }
      setMembers(Array.isArray(data) ? data : []);
      setPage(0);
    } catch {
      setError(t('communityDashboard.users.loadFailed'));
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [handle, token, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedMembers = useMemo(() => {
    const list = [...members];
    list.sort((a, b) => {
      if (sortKey === 'joinedAt') {
        const ta = new Date(a.joinedAt).getTime() || 0;
        const tb = new Date(b.joinedAt).getTime() || 0;
        return sortDir === 'desc' ? tb - ta : ta - tb;
      }
      return 0;
    });
    return list;
  }, [members, sortKey, sortDir]);

  const total = sortedMembers.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sortedMembers.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min((safePage + 1) * PAGE_SIZE, total);

  const toggleJoinedSort = () => {
    if (sortKey === 'joinedAt') {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey('joinedAt');
      setSortDir('desc');
    }
  };

  const handleExport = () => {
    const header = [
      'User',
      'Email',
      'Status',
      'Country',
      'Total spend',
      'Joined at',
      'Last accessed',
      'Role',
    ];
    const lines = sortedMembers.map((row) =>
      [
        displayName(row),
        row.email,
        row.status,
        '',
        formatUsd(row.totalSpend ?? 0),
        row.joinedAt,
        row.lastAccessedAt || row.joinedAt,
        row.role,
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${handle}-users.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="border-b border-neutral-200 bg-white px-4 pt-4">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'users'
                ? 'border-[#315efb] text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t('communityDashboard.users.tabUsers')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('memberships')}
            className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
              activeTab === 'memberships'
                ? 'border-[#315efb] text-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t('communityDashboard.users.tabMemberships')}
          </button>
        </div>
      </div>

      {activeTab === 'memberships' ? (
        <MembershipsPanel
          memberships={analyticsData?.memberships ?? []}
          loading={analyticsLoading}
          error={analyticsError}
          handle={handle}
        />
      ) : (
        <>
          {/* <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-8 py-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={members.length === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" aria-hidden />
                Export
              </button>
            </div>
          </div> */}

          <div className="flex-1 bg-white">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
              </div>
            ) : error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            ) : total === 0 ? (
              <p className="py-20 text-center text-neutral-500">{t('communityDashboard.users.noMembers')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <HeaderCell label={t('communityDashboard.users.colUser')} />
                      <HeaderCell label={t('communityDashboard.users.colEmail')} />
                      <HeaderCell label={t('communityDashboard.users.colStatus')} />
                      <HeaderCell label={t('communityDashboard.users.colCountry')} />
                      <HeaderCell
                        label={t('communityDashboard.users.colTotalSpend')}
                        sortIcon={<ArrowUpDown className="h-3.5 w-3.5 text-neutral-400" aria-hidden />}
                      />
                      <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
                        <button
                          type="button"
                          onClick={toggleJoinedSort}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-neutral-700"
                        >
                          {t('communityDashboard.users.colJoinedAt')}
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${
                              sortKey === 'joinedAt' && sortDir === 'asc' ? 'rotate-180' : ''
                            }`}
                            aria-hidden
                          />
                          <GripVertical className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
                        </button>
                      </th>
                      <HeaderCell label={t('communityDashboard.users.colLastAccessed')} />
                      <HeaderCell label={t('communityDashboard.users.colContact')} />
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-4">
                          <Link
                            to={profilePath(row.username)}
                            className="flex items-center gap-3 hover:opacity-80"
                          >
                            <img
                              src={avatarUrl(row)}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            <span className="font-medium text-neutral-900">{displayName(row)}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-neutral-700">{row.email || '—'}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600">
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-neutral-600">—</td>
                        <td className="px-4 py-4 text-neutral-700">
                          {formatUsd(row.totalSpend ?? 0)}
                        </td>
                        <td className="px-4 py-4 text-neutral-600">{formatRelativeTime(row.joinedAt)}</td>
                        <td className="px-4 py-4 text-neutral-600">
                          {formatRelativeTime(row.lastAccessedAt || row.joinedAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              to="/messenger"
                              className="text-neutral-500 transition-colors hover:text-neutral-800"
                              title={t('communityDashboard.users.messageTitle')}
                            >
                              <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                            </Link>
                            {row.email ? (
                              <a
                                href={`mailto:${row.email}`}
                                className="text-neutral-500 transition-colors hover:text-neutral-800"
                                title={t('communityDashboard.users.emailTitle')}
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
          </div>

          {!loading && !error && total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-1">
              <p className="text-sm text-neutral-500">
                {t('communityDashboard.users.showingRange', {
                  start: rangeStart,
                  end: rangeEnd,
                  total,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage(0)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                  aria-label={t('communityDashboard.users.pageFirst')}
                >
                  <ChevronsLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                  aria-label={t('communityDashboard.users.pagePrev')}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                  aria-label={t('communityDashboard.users.pageNext')}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages - 1}
                  onClick={() => setPage(totalPages - 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
                  aria-label={t('communityDashboard.users.pageLast')}
                >
                  <ChevronsRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CommunityDashboardUsers;
