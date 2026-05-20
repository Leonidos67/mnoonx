import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Link2,
  MoreVertical,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import { communityPath, communityStorePath } from '../../constants/communityRoutes';
import { getDashboardAppLabel } from '../../components/Community/Dashboard/dashboardAppMeta';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from '../../i18n/useTranslation';

import { COMMUNITIES_API as API_URL } from '../../config/api';
const PAGE_SIZE = 25;

interface ProductRow {
  id: string;
  instanceId?: string;
  name: string;
  price: string;
  visibility: 'Visible' | 'Hidden';
  visibleToMembers: boolean;
  includedApps: string;
  allTimeRevenue: string;
  activeUsers: number;
}

// type VisibilityFilter = 'all' | 'chip';
type SortKey = 'activeUsers' | 'name';

const HeaderCell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {children ?? label}
      {!children && <GripVertical className="h-3.5 w-3.5 text-neutral-300" aria-hidden />}
    </span>
  </th>
);

const CommunityDashboardProducts: React.FC = () => {
  const navigate = useNavigate();
  const { handle, community, setCommunity, reload } = useCommunityDashboard();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();

  // const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('chip');
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('activeUsers');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [menuProductId, setMenuProductId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const allProducts = useMemo<ProductRow[]>(() => {
    if (!community) return [];
    const rows: ProductRow[] = [];

    (community.installedAppInstances ?? []).forEach((inst) => {
      const visible = inst.visibleToMembers !== false;
      rows.push({
        id: inst.id,
        instanceId: inst.id,
        name: inst.title,
        price: t('communityDashboard.free'),
        visibility: visible ? 'Visible' : 'Hidden',
        visibleToMembers: visible,
        includedApps: getDashboardAppLabel(inst.appId, t),
        allTimeRevenue: '$0.00',
        activeUsers: 0,
      });
    });

    if (community.isPaid) {
      rows.push({
        id: 'membership',
        name: t('communityDashboard.products.membershipName', { name: community.name }),
        price: community.price > 0 ? `$${community.price.toFixed(2)}` : t('communityDashboard.free'),
        visibility: 'Visible',
        visibleToMembers: true,
        includedApps: t('communityDashboard.products.communityAccess'),
        allTimeRevenue: '$0.00',
        activeUsers: community.memberCount ?? 0,
      });
    }

    return rows;
  }, [community, t]);

  const filteredProducts = allProducts;

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    list.sort((a, b) => {
      if (sortKey === 'activeUsers') {
        const diff = a.activeUsers - b.activeUsers;
        return sortDir === 'desc' ? -diff : diff;
      }
      const cmp = a.name.localeCompare(b.name);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [filteredProducts, sortKey, sortDir]);

  const total = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sortedProducts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min((safePage + 1) * PAGE_SIZE, total);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuProductId(null);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  const visibilityLabel = (visibility: ProductRow['visibility']) =>
    visibility === 'Visible' ? t('communityDashboard.visible') : t('communityDashboard.hidden');

  const patchVisibility = useCallback(
    async (instanceId: string, visibleToMembers: boolean) => {
      if (!token || !handle) return;
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ visibleToMembers }),
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(typeof data?.message === 'string' ? data.message : t('communityDashboard.products.failedUpdate'), 'error');
          return;
        }
        const data = await res.json();
        setCommunity(data);
        await reload();
        showToast(
          visibleToMembers
            ? t('communityDashboard.products.nowVisible')
            : t('communityDashboard.products.nowHidden')
        );
      } catch {
        showToast(t('communityDashboard.products.failedUpdate'), 'error');
      }
      setMenuProductId(null);
    },
    [token, handle, setCommunity, reload, showToast, t]
  );

  const deleteInstance = useCallback(
    async (instanceId: string) => {
      if (!token || !handle) return;
      const confirmed = await confirm({
        title: t('communityDashboard.products.removeTitle'),
        message: t('communityDashboard.products.removeMessage'),
        confirmLabel: t('communityDashboard.products.removeConfirm'),
        variant: 'danger',
      });
      if (!confirmed) return;
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(typeof data?.message === 'string' ? data.message : t('communityDashboard.products.failedDelete'), 'error');
          return;
        }
        const data = await res.json();
        setCommunity(data);
        await reload();
        showToast(t('communityDashboard.products.removed'));
      } catch {
        showToast(t('communityDashboard.products.failedDelete'), 'error');
      }
      setMenuProductId(null);
    },
    [token, handle, setCommunity, reload, confirm, showToast, t]
  );

  const copyProductLink = (row: ProductRow) => {
    const base = window.location.origin;
    const url = row.instanceId
      ? `${base}${communityPath(handle)}`
      : `${base}${communityPath(handle)}`;
    void navigator.clipboard.writeText(url);
    setMenuProductId(null);
  };

  const toggleActiveUsersSort = () => {
    if (sortKey === 'activeUsers') {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortKey('activeUsers');
      setSortDir('desc');
    }
  };

  if (!community) return null;

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 bg-white px-2 py-2">
        <div className="flex flex-wrap items-center gap-2">
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(communityStorePath(handle))}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#315efb] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2748c9]"
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('communityDashboard.products.createProduct')}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white pb-6 pt-2">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-medium text-neutral-800">{t('communityDashboard.products.noProductsTitle')}</p>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              {t('communityDashboard.products.noProductsHint')}
            </p>
            <button
              type="button"
              onClick={() => navigate(communityStorePath(handle))}
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#315efb] px-4 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('communityDashboard.products.createProduct')}
            </button>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <HeaderCell label={t('communityDashboard.products.colName')} />
                <HeaderCell label={t('communityDashboard.products.colPrice')} />
                <HeaderCell label={t('communityDashboard.products.colVisibility')} />
                <HeaderCell label={t('communityDashboard.products.colIncludedApps')} />
                <HeaderCell label={t('communityDashboard.products.colAllTimeRevenue')} />
                <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
                  <button
                    type="button"
                    onClick={toggleActiveUsersSort}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-neutral-700"
                  >
                    {t('communityDashboard.products.colActiveUsers')}
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-neutral-500 transition-transform ${
                        sortKey === 'activeUsers' && sortDir === 'asc' ? 'rotate-180' : ''
                      }`}
                      aria-hidden
                    />
                    <GripVertical className="h-3.5 w-3.5 text-neutral-300" aria-hidden />
                  </button>
                </th>
                <th className="w-[88px] px-2 py-3" aria-label={t('communityDashboard.products.actions')} />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const menuOpen = menuProductId === row.id;
                return (
                  <tr key={row.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-4 font-medium text-neutral-900">{row.name}</td>
                    <td className="px-4 py-4 text-neutral-700">{row.price}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${
                          row.visibility === 'Visible'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {visibilityLabel(row.visibility)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-neutral-600">{row.includedApps || '—'}</td>
                    <td className="px-4 py-4 text-neutral-700">{row.allTimeRevenue}</td>
                    <td className="px-4 py-4 text-neutral-700 tabular-nums">{row.activeUsers}</td>
                    <td className="relative px-2 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => copyProductLink(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                          title={t('communityDashboard.products.copyLink')}
                        >
                          <Link2 className="h-4 w-4" aria-hidden />
                        </button>
                        <div className="relative" ref={menuOpen ? menuRef : undefined}>
                          <button
                            type="button"
                            onClick={() => setMenuProductId((id) => (id === row.id ? null : row.id))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                            aria-label={t('communityDashboard.products.productOptions')}
                          >
                            <MoreVertical className="h-4 w-4" aria-hidden />
                          </button>
                          {menuOpen && (
                            <div
                              className="absolute right-0 top-full z-[500] mt-1 w-48 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
                              role="menu"
                            >
                              <button
                                type="button"
                                className="flex w-full px-4 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                                onClick={() => {
                                  navigate(communityStorePath(handle));
                                  setMenuProductId(null);
                                }}
                              >
                                {t('communityDashboard.products.edit')}
                              </button>
                              <button
                                type="button"
                                className="flex w-full px-4 py-2 text-left text-sm text-neutral-400"
                                disabled
                              >
                                {t('communityDashboard.products.controlCenter')}
                              </button>
                              <button
                                type="button"
                                className="flex w-full px-4 py-2 text-left text-sm text-neutral-400"
                                disabled
                              >
                                {t('communityDashboard.products.archive')}
                              </button>
                              {row.instanceId && (
                                <button
                                  type="button"
                                  className="flex w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                  onClick={() => void deleteInstance(row.instanceId!)}
                                >
                                  {t('communityDashboard.products.delete')}
                                </button>
                              )}
                              {row.instanceId && (
                                <button
                                  type="button"
                                  className="flex w-full px-4 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                                  onClick={() =>
                                    void patchVisibility(row.instanceId!, !row.visibleToMembers)
                                  }
                                >
                                  {row.visibleToMembers
                                    ? t('communityDashboard.products.hide')
                                    : t('communityDashboard.products.show')}
                                </button>
                              )}
                              <button
                                type="button"
                                className="flex w-full px-4 py-2 text-left text-sm text-neutral-400"
                                disabled
                              >
                                {t('communityDashboard.products.duplicate')}
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-neutral-400"
                                disabled
                              >
                                {t('communityDashboard.products.details')}
                                <ChevronRight className="h-4 w-4" aria-hidden />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {total > 0 && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 bg-white px-4 py-1">
        <p className="text-sm text-neutral-500">
          {t('communityDashboard.products.showingRange', {
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
            aria-label={t('communityDashboard.products.pageFirst')}
          >
            <ChevronsLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
            aria-label={t('communityDashboard.products.pagePrev')}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
            aria-label={t('communityDashboard.products.pageNext')}
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage(totalPages - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 disabled:opacity-30"
            aria-label={t('communityDashboard.products.pageLast')}
          >
            <ChevronsRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
      )}
    </div>
  );
};

export default CommunityDashboardProducts;
