import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  BarChart3,
  Archive,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import { communityPath, communityStorePath } from '../../constants/communityRoutes';
import { getDashboardAppLabel } from '../../components/Community/Dashboard/dashboardAppMeta';
import ProductAppStatsModal from '../../components/Community/Dashboard/ProductAppStatsModal';
import ProductSettingsModal, {
  type ProductSettingsValues,
} from '../../components/Community/Dashboard/ProductSettingsModal';
import ProductsArchiveModal from '../../components/Community/Dashboard/ProductsArchiveModal';
import FloatingMenu, { type FloatingMenuAnchor } from '../../components/Common/FloatingMenu';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { useTranslation } from '../../i18n/useTranslation';
import { trackCommunityAppStat } from '../../utils/trackCommunityAppStat';

import { COMMUNITIES_API as API_URL } from '../../config/api';
const PAGE_SIZE = 25;

interface ProductRow {
  id: string;
  instanceId?: string;
  appId?: string;
  name: string;
  note: string;
  price: string;
  visibility: 'Visible' | 'Hidden';
  visibleToMembers: boolean;
  includedApps: string;
  allTimeRevenue: string;
  activeUsers: number;
}

type SortKey = 'activeUsers' | 'name';
type MenuPanel = 'main' | 'export' | 'order';

const HeaderCell: React.FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => (
  <th className="whitespace-nowrap px-4 py-3 text-left text-sm font-medium text-neutral-500">
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {children ?? label}
      {!children && <GripVertical className="h-3.5 w-3.5 text-neutral-300" aria-hidden />}
    </span>
  </th>
);

const menuItemClass =
  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50';

const CommunityDashboardProducts: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { handle, community, setCommunity, reload } = useCommunityDashboard();
  const { token } = useAuth();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const { t } = useTranslation();

  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('activeUsers');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [menuProductId, setMenuProductId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<FloatingMenuAnchor | null>(null);
  const [menuPanel, setMenuPanel] = useState<MenuPanel>('main');
  const [statsInstanceId, setStatsInstanceId] = useState<string | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<ProductRow | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveBusyId, setArchiveBusyId] = useState<string | null>(null);

  const activeInstances = useMemo(
    () => (community?.installedAppInstances ?? []).filter((i) => !i.archivedAt),
    [community],
  );

  const archivedInstances = useMemo(
    () => (community?.installedAppInstances ?? []).filter((i) => Boolean(i.archivedAt)),
    [community],
  );

  const allProducts = useMemo<ProductRow[]>(() => {
    if (!community) return [];
    const rows: ProductRow[] = [];

    activeInstances.forEach((inst) => {
      const visible = inst.visibleToMembers !== false;
      rows.push({
        id: inst.id,
        instanceId: inst.id,
        appId: inst.appId,
        name: inst.title,
        note: inst.note || '',
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
        note: '',
        price: community.price > 0 ? `$${community.price.toFixed(2)}` : t('communityDashboard.free'),
        visibility: 'Visible',
        visibleToMembers: true,
        includedApps: t('communityDashboard.products.communityAccess'),
        allTimeRevenue: '$0.00',
        activeUsers: community.memberCount ?? 0,
      });
    }

    return rows;
  }, [community, activeInstances, t]);

  const sortedProducts = useMemo(() => {
    const list = [...allProducts];
    list.sort((a, b) => {
      if (sortKey === 'activeUsers') {
        const diff = a.activeUsers - b.activeUsers;
        return sortDir === 'desc' ? -diff : diff;
      }
      const cmp = a.name.localeCompare(b.name);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return list;
  }, [allProducts, sortKey, sortDir]);

  const total = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sortedProducts.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = total === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min((safePage + 1) * PAGE_SIZE, total);

  const menuRow = useMemo(
    () => (menuProductId ? sortedProducts.find((r) => r.id === menuProductId) ?? null : null),
    [menuProductId, sortedProducts],
  );

  const activeAppIndex = useMemo(() => {
    if (!menuRow?.instanceId) return -1;
    return activeInstances.findIndex((i) => i.id === menuRow.instanceId);
  }, [menuRow, activeInstances]);

  const closeMenu = useCallback(() => {
    setMenuProductId(null);
    setMenuAnchor(null);
    setMenuPanel('main');
  }, []);

  const openStats = useCallback(
    (instanceId: string) => {
      closeMenu();
      setStatsInstanceId(instanceId);
      const next = new URLSearchParams(searchParams);
      next.set('app', instanceId);
      setSearchParams(next, { replace: true });
    },
    [closeMenu, searchParams, setSearchParams],
  );

  const closeStats = useCallback(() => {
    setStatsInstanceId(null);
    if (searchParams.has('app')) {
      const next = new URLSearchParams(searchParams);
      next.delete('app');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openSettings = useCallback(
    (row: ProductRow) => {
      if (!row.instanceId) return;
      closeMenu();
      setSettingsTarget(row);
    },
    [closeMenu],
  );

  useEffect(() => {
    const appId = searchParams.get('app');
    if (!appId || !community) return;
    const exists = activeInstances.some((i) => i.id === appId);
    if (exists) setStatsInstanceId(appId);
  }, [searchParams, community, activeInstances]);

  const visibilityLabel = (visibility: ProductRow['visibility']) =>
    visibility === 'Visible' ? t('communityDashboard.visible') : t('communityDashboard.hidden');

  const patchInstance = useCallback(
    async (instanceId: string, body: Record<string, unknown>, successToast?: string) => {
      if (!token || !handle) return false;
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(
            typeof data?.message === 'string' ? data.message : t('communityDashboard.products.failedUpdate'),
            'error',
          );
          return false;
        }
        const data = await res.json();
        setCommunity(data);
        await reload();
        if (successToast) showToast(successToast);
        return true;
      } catch {
        showToast(t('communityDashboard.products.failedUpdate'), 'error');
        return false;
      }
    },
    [token, handle, setCommunity, reload, showToast, t],
  );

  const deleteInstance = useCallback(
    async (instanceId: string, forever: boolean) => {
      if (!token || !handle) return;
      const confirmed = await confirm({
        title: forever
          ? t('communityDashboard.products.deleteForeverTitle')
          : t('communityDashboard.products.removeTitle'),
        message: forever
          ? t('communityDashboard.products.deleteForeverMessage')
          : t('communityDashboard.products.removeMessage'),
        confirmLabel: forever
          ? t('communityDashboard.products.deleteForever')
          : t('communityDashboard.products.removeConfirm'),
        variant: 'danger',
      });
      if (!confirmed) return;
      setArchiveBusyId(instanceId);
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(
            typeof data?.message === 'string' ? data.message : t('communityDashboard.products.failedDelete'),
            'error',
          );
          return;
        }
        const data = await res.json();
        setCommunity(data);
        await reload();
        showToast(
          forever
            ? t('communityDashboard.products.deletedForever')
            : t('communityDashboard.products.removed'),
        );
      } catch {
        showToast(t('communityDashboard.products.failedDelete'), 'error');
      } finally {
        setArchiveBusyId(null);
        closeMenu();
      }
    },
    [token, handle, setCommunity, reload, confirm, showToast, t, closeMenu],
  );

  const archiveInstance = useCallback(
    async (instanceId: string) => {
      closeMenu();
      const ok = await patchInstance(
        instanceId,
        { archived: true },
        t('communityDashboard.products.archivedToast'),
      );
      if (ok && statsInstanceId === instanceId) closeStats();
    },
    [closeMenu, patchInstance, t, statsInstanceId, closeStats],
  );

  const restoreInstance = useCallback(
    async (instanceId: string) => {
      setArchiveBusyId(instanceId);
      try {
        await patchInstance(instanceId, { archived: false }, t('communityDashboard.products.restoredToast'));
      } finally {
        setArchiveBusyId(null);
      }
    },
    [patchInstance, t],
  );

  const duplicateInstance = useCallback(
    async (instanceId: string) => {
      if (!token || !handle) return;
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}/duplicate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ copySuffix: t('communityDashboard.products.duplicateSuffix') }),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          showToast(
            typeof data?.message === 'string'
              ? data.message
              : t('communityDashboard.products.failedDuplicate'),
            'error',
          );
          return;
        }
        const data = await res.json();
        setCommunity(data);
        await reload();
        showToast(t('communityDashboard.products.duplicatedToast'));
      } catch {
        showToast(t('communityDashboard.products.failedDuplicate'), 'error');
      }
      closeMenu();
    },
    [token, handle, setCommunity, reload, showToast, t, closeMenu],
  );

  const moveInstance = useCallback(
    async (instanceId: string, direction: 'up' | 'down') => {
      if (!token || !handle) return;
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}/move`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ direction }),
          },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.code !== 'cannot_move') {
            showToast(
              typeof data?.message === 'string' ? data.message : t('communityDashboard.products.failedMove'),
              'error',
            );
          }
          return;
        }
        const data = await res.json();
        setCommunity(data);
        await reload();
      } catch {
        showToast(t('communityDashboard.products.failedMove'), 'error');
      }
    },
    [token, handle, setCommunity, reload, showToast, t],
  );

  const submitSettings = useCallback(
    async (values: ProductSettingsValues) => {
      if (!settingsTarget?.instanceId) return;
      setSettingsSaving(true);
      try {
        const ok = await patchInstance(
          settingsTarget.instanceId,
          { title: values.title, note: values.note },
          t('communityDashboard.products.settingsSaved'),
        );
        if (ok) setSettingsTarget(null);
      } finally {
        setSettingsSaving(false);
      }
    },
    [settingsTarget, patchInstance, t],
  );

  const exportStatsCsv = useCallback(
    async (instanceId: string, mode: 'summary' | 'daily') => {
      if (!token || !handle) return;
      closeMenu();
      try {
        const res = await fetch(
          `${API_URL}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}/stats`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          showToast(t('communityDashboard.products.statsFailed'), 'error');
          return;
        }
        const stats = await res.json();
        let csv = '';
        if (mode === 'summary') {
          csv = [
            'metric,value',
            `title,"${String(stats.title || '').replace(/"/g, '""')}"`,
            `opens,${stats.opens || 0}`,
            `pageViews,${stats.pageViews || 0}`,
            `clicks,${stats.clicks || 0}`,
            typeof stats.extras?.chatMessages === 'number'
              ? `chatMessages,${stats.extras.chatMessages}`
              : null,
          ]
            .filter(Boolean)
            .join('\n');
        } else {
          const rows = (stats.daily || []) as Array<{
            date: string;
            opens: number;
            pageViews: number;
            clicks: number;
          }>;
          csv = ['date,opens,pageViews,clicks', ...rows.map((r) => `${r.date},${r.opens},${r.pageViews},${r.clicks}`)].join(
            '\n',
          );
        }
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download =
          mode === 'summary'
            ? `${stats.title || 'app'}-stats-summary.csv`
            : `${stats.title || 'app'}-stats-daily.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(t('communityDashboard.products.exportDone'));
      } catch {
        showToast(t('communityDashboard.products.statsFailed'), 'error');
      }
    },
    [token, handle, closeMenu, showToast, t],
  );

  const copyProductLink = (row: ProductRow) => {
    const base = window.location.origin;
    const url = row.instanceId
      ? `${base}${communityPath(handle)}?openApp=${encodeURIComponent(row.instanceId)}`
      : `${base}${communityPath(handle)}`;
    void navigator.clipboard.writeText(url);
    showToast(t('common.linkCopied'));
    if (row.instanceId) trackCommunityAppStat(handle, row.instanceId, 'click', token);
    closeMenu();
  };

  const openInCommunity = (row: ProductRow) => {
    closeMenu();
    if (row.instanceId) {
      navigate(`${communityPath(handle)}?openApp=${encodeURIComponent(row.instanceId)}`);
    } else {
      navigate(communityPath(handle));
    }
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
        <div className="flex flex-wrap items-center gap-2" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
          >
            <Archive className="h-4 w-4" aria-hidden />
            {t('communityDashboard.products.archive')}
            {archivedInstances.length > 0 ? (
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-xs tabular-nums text-neutral-600">
                {archivedInstances.length}
              </span>
            ) : null}
          </button>
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
            <p className="text-lg font-medium text-neutral-800">
              {t('communityDashboard.products.noProductsTitle')}
            </p>
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
                  <th className="w-[120px] px-2 py-3" aria-label={t('communityDashboard.products.actions')} />
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
                      <td className="px-2 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {row.instanceId && (
                            <button
                              type="button"
                              onClick={() => openStats(row.instanceId!)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-800"
                              title={t('communityDashboard.products.openStats')}
                              aria-label={t('communityDashboard.products.openStats')}
                            >
                              <BarChart3 className="h-4 w-4" aria-hidden />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => copyProductLink(row)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                            title={t('communityDashboard.products.copyLink')}
                          >
                            <Link2 className="h-4 w-4" aria-hidden />
                          </button>
                          {row.instanceId && (
                            <button
                              type="button"
                              data-floating-menu-trigger
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                if (menuOpen) {
                                  closeMenu();
                                  return;
                                }
                                setMenuPanel('main');
                                setMenuAnchor({ rect });
                                setMenuProductId(row.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                              aria-label={t('communityDashboard.products.productOptions')}
                              aria-expanded={menuOpen}
                              aria-haspopup="menu"
                            >
                              <MoreVertical className="h-4 w-4" aria-hidden />
                            </button>
                          )}
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

      <FloatingMenu
        open={Boolean(menuRow && menuAnchor)}
        anchor={menuAnchor}
        onClose={closeMenu}
        width={220}
      >
        {menuRow && menuPanel === 'main' && (
          <>
            {menuRow.instanceId && (
              <>
                <button type="button" className={menuItemClass} onClick={() => openSettings(menuRow)} role="menuitem">
                  {t('communityDashboard.products.settings')}
                </button>
                <button type="button" className={menuItemClass} onClick={() => openSettings(menuRow)} role="menuitem">
                  {t('communityDashboard.products.edit')}
                </button>
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => openStats(menuRow.instanceId!)}
                  role="menuitem"
                >
                  {t('communityDashboard.products.stats')}
                </button>
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => void duplicateInstance(menuRow.instanceId!)}
                  role="menuitem"
                >
                  {t('communityDashboard.products.duplicate')}
                </button>
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() =>
                    void patchInstance(
                      menuRow.instanceId!,
                      { visibleToMembers: !menuRow.visibleToMembers },
                      menuRow.visibleToMembers
                        ? t('communityDashboard.products.nowHidden')
                        : t('communityDashboard.products.nowVisible'),
                    ).then(() => closeMenu())
                  }
                  role="menuitem"
                >
                  {menuRow.visibleToMembers
                    ? t('communityDashboard.products.hide')
                    : t('communityDashboard.products.show')}
                </button>
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => openInCommunity(menuRow)}
                  role="menuitem"
                >
                  {t('communityDashboard.products.openInCommunity')}
                </button>
                <button type="button" className={menuItemClass} onClick={() => copyProductLink(menuRow)} role="menuitem">
                  {t('communityDashboard.products.copyLink')}
                </button>
                <button
                  type="button"
                  className={`${menuItemClass} justify-between`}
                  onClick={() => setMenuPanel('export')}
                  role="menuitem"
                >
                  <span>{t('communityDashboard.products.exportStats')}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </button>
                <button
                  type="button"
                  className={`${menuItemClass} justify-between`}
                  onClick={() => setMenuPanel('order')}
                  role="menuitem"
                >
                  <span>{t('communityDashboard.products.order')}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </button>
                <div className="my-1 h-px bg-neutral-100" />
                <button
                  type="button"
                  className={menuItemClass}
                  onClick={() => void archiveInstance(menuRow.instanceId!)}
                  role="menuitem"
                >
                  {t('communityDashboard.products.archive')}
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  onClick={() => void deleteInstance(menuRow.instanceId!, false)}
                  role="menuitem"
                >
                  {t('communityDashboard.products.delete')}
                </button>
              </>
            )}
          </>
        )}

        {menuRow?.instanceId && menuPanel === 'export' && (
          <>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => setMenuPanel('main')}
              role="menuitem"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('common.back')}
            </button>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => void exportStatsCsv(menuRow.instanceId!, 'summary')}
              role="menuitem"
            >
              {t('communityDashboard.products.exportSummary')}
            </button>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => void exportStatsCsv(menuRow.instanceId!, 'daily')}
              role="menuitem"
            >
              {t('communityDashboard.products.exportDaily')}
            </button>
          </>
        )}

        {menuRow?.instanceId && menuPanel === 'order' && (
          <>
            <button
              type="button"
              className={menuItemClass}
              onClick={() => setMenuPanel('main')}
              role="menuitem"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {t('common.back')}
            </button>
            <button
              type="button"
              disabled={activeAppIndex <= 0}
              className={`${menuItemClass} disabled:cursor-not-allowed disabled:text-neutral-300`}
              onClick={() => void moveInstance(menuRow.instanceId!, 'up')}
              role="menuitem"
            >
              {t('communityDashboard.products.moveUp')}
            </button>
            <button
              type="button"
              disabled={activeAppIndex < 0 || activeAppIndex >= activeInstances.length - 1}
              className={`${menuItemClass} disabled:cursor-not-allowed disabled:text-neutral-300`}
              onClick={() => void moveInstance(menuRow.instanceId!, 'down')}
              role="menuitem"
            >
              {t('communityDashboard.products.moveDown')}
            </button>
          </>
        )}
      </FloatingMenu>

      <ProductAppStatsModal
        open={statsInstanceId !== null}
        handle={handle}
        instanceId={statsInstanceId}
        token={token}
        onClose={closeStats}
      />

      <ProductSettingsModal
        open={settingsTarget !== null}
        initialTitle={settingsTarget?.name ?? ''}
        initialNote={settingsTarget?.note ?? ''}
        saving={settingsSaving}
        onClose={() => {
          if (!settingsSaving) setSettingsTarget(null);
        }}
        onSubmit={(values) => void submitSettings(values)}
      />

      <ProductsArchiveModal
        open={archiveOpen}
        items={archivedInstances.map((i) => ({
          id: i.id,
          appId: i.appId,
          title: i.title,
          archivedAt: i.archivedAt,
        }))}
        busyId={archiveBusyId}
        onClose={() => setArchiveOpen(false)}
        onRestore={(id) => void restoreInstance(id)}
        onDeleteForever={(id) => void deleteInstance(id, true)}
      />
    </div>
  );
};

export default CommunityDashboardProducts;
