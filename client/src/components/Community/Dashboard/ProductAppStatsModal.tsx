import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Eye, MousePointerClick, X, MessageCircle, DoorOpen } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ResponsiveDialogShell from '../../Common/ResponsiveDialogShell';
import { COMMUNITIES_API } from '../../../config/api';
import { useTranslation } from '../../../i18n/useTranslation';
import { formatChartDate } from '../../../hooks/useDashboardAnalytics';

export type ProductAppStats = {
  instanceId: string;
  appId: string;
  title: string;
  visibleToMembers: boolean;
  opens: number;
  pageViews: number;
  clicks: number;
  lastOpenedAt: string | null;
  daily: Array<{ date: string; opens: number; pageViews: number; clicks: number }>;
  extras?: { chatMessages?: number };
};

type ProductAppStatsModalProps = {
  open: boolean;
  handle: string;
  instanceId: string | null;
  token: string | null;
  onClose: () => void;
};

const chartTooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e5e5e5',
  fontSize: 12,
};

const ProductAppStatsModal: React.FC<ProductAppStatsModalProps> = ({
  open,
  handle,
  instanceId,
  token,
  onClose,
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProductAppStats | null>(null);

  useEffect(() => {
    if (!open || !instanceId || !token || !handle) {
      setStats(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const res = await fetch(
          `${COMMUNITIES_API}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}/stats`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            typeof data?.message === 'string'
              ? data.message
              : t('communityDashboard.products.statsFailed'),
          );
        }
        const data = (await res.json()) as ProductAppStats;
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) {
          setStats(null);
          setError(e instanceof Error ? e.message : t('communityDashboard.products.statsFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, instanceId, token, handle, t]);

  const chartData = useMemo(
    () =>
      (stats?.daily ?? []).map((row) => ({
        ...row,
        label: formatChartDate(row.date),
      })),
    [stats?.daily],
  );

  const metrics = useMemo(() => {
    if (!stats) return [];
    const rows = [
      {
        label: t('communityDashboard.products.statsOpens'),
        value: String(stats.opens),
        icon: DoorOpen,
      },
      {
        label: t('communityDashboard.products.statsPageViews'),
        value: String(stats.pageViews),
        icon: Eye,
      },
      {
        label: t('communityDashboard.products.statsClicks'),
        value: String(stats.clicks),
        icon: MousePointerClick,
      },
    ];
    if (typeof stats.extras?.chatMessages === 'number') {
      rows.push({
        label: t('communityDashboard.products.statsChatMessages'),
        value: String(stats.extras.chatMessages),
        icon: MessageCircle,
      });
    }
    return rows;
  }, [stats, t]);

  const title = stats?.title
    ? t('communityDashboard.products.statsTitleNamed', { name: stats.title })
    : t('communityDashboard.products.statsTitle');

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={title}
      zIndexClass="z-[130]"
      panelClassName="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      sheetContentClassName="max-h-[92dvh]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-neutral-500">
            <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">
              {t('communityDashboard.products.statsEyebrow')}
            </span>
          </div>
          <h2 className="mt-1 truncate text-xl font-bold text-neutral-900">{title}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {t('communityDashboard.products.statsSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : stats ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {metrics.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-neutral-200 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-neutral-900">
                {t('communityDashboard.products.statsChartTitle')}
              </h3>
              <p className="mt-0.5 text-xs text-neutral-500">
                {t('communityDashboard.products.statsChartSub')}
              </p>
              <div className="mt-4 h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#737373' }}
                      interval="preserveStartEnd"
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#737373' }}
                      tickLine={false}
                      axisLine={false}
                      width={28}
                    />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar
                      dataKey="opens"
                      fill="#315efb"
                      radius={[4, 4, 0, 0]}
                      name={t('communityDashboard.products.statsOpens')}
                    />
                    <Bar
                      dataKey="pageViews"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                      name={t('communityDashboard.products.statsPageViews')}
                    />
                    <Bar
                      dataKey="clicks"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                      name={t('communityDashboard.products.statsClicks')}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ResponsiveDialogShell>
  );
};

export default ProductAppStatsModal;
