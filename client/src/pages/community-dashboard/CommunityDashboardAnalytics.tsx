import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, LayoutGrid, MessageCircle, DollarSign, UserPlus } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import {
  formatChartDate,
  formatUsd,
  useDashboardAnalytics,
} from '../../hooks/useDashboardAnalytics';
import {
  communityDashboardContentPath,
  communityDashboardInvitesPath,
  communityDashboardUsersPath,
  communityStorePath,
} from '../../constants/communityRoutes';
import { useTranslation } from '../../i18n/useTranslation';

const chartTooltipStyle = {
  borderRadius: 8,
  border: '1px solid #e5e5e5',
  fontSize: 12,
};

const CommunityDashboardAnalytics: React.FC = () => {
  const { handle, community } = useCommunityDashboard();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { data, loading, error } = useDashboardAnalytics(handle, token);

  const memberChartData = useMemo(
    () =>
      (data?.memberGrowth ?? []).map((row) => ({
        ...row,
        label: formatChartDate(row.date),
      })),
    [data?.memberGrowth]
  );

  const postsChartData = useMemo(
    () =>
      (data?.postsActivity ?? []).map((row) => ({
        ...row,
        label: formatChartDate(row.date),
      })),
    [data?.postsActivity]
  );

  const cumulativeChartData = useMemo(
    () =>
      (data?.memberGrowthCumulative ?? []).map((row) => ({
        ...row,
        label: formatChartDate(row.date),
      })),
    [data?.memberGrowthCumulative]
  );

  const summary = data?.summary;

  const metrics = useMemo(
    () => [
      {
        label: t('communityDashboard.analytics.totalMembers'),
        value: loading ? '…' : String(summary?.memberCount ?? community?.memberCount ?? 0),
        icon: Users,
      },
      {
        label: t('communityDashboard.analytics.feedPosts'),
        value: loading ? '…' : String(summary?.postCount ?? 0),
        icon: FileText,
      },
      {
        label: t('communityDashboard.analytics.installedApps'),
        value: loading ? '…' : String(summary?.appCount ?? 0),
        icon: LayoutGrid,
      },
      {
        label: t('communityDashboard.analytics.unreadChat'),
        value: loading ? '…' : String(summary?.totalChatUnread ?? 0),
        icon: MessageCircle,
      },
      {
        label: t('communityDashboard.analytics.estRevenue'),
        value: loading ? '…' : formatUsd(summary?.estimatedRevenue ?? 0),
        icon: DollarSign,
        hint: summary?.isPaid
          ? t('communityDashboard.analytics.revenueHintPaid', { price: String(summary?.price ?? 0) })
          : t('communityDashboard.analytics.revenueHintFree'),
      },
      {
        label: t('communityDashboard.analytics.newMembers7d'),
        value: loading ? '…' : String(summary?.newMembers7d ?? 0),
        icon: UserPlus,
      },
    ],
    [community?.memberCount, loading, summary, t]
  );

  if (!community) return null;

  return (
    <div className="min-h-full bg-white p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('communityDashboard.analytics.title')}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t('communityDashboard.analytics.last30Days', { name: community.name })}
      </p>

      {error ? (
        <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon, hint }) => (
          <div key={label} className="rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center gap-2 text-neutral-500">
              <Icon className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
            {hint ? <p className="mt-1 text-xs text-neutral-400">{hint}</p> : null}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="mt-12 flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <ChartCard title={t('communityDashboard.analytics.chartNewMembers')} subtitle={t('communityDashboard.analytics.chartNewMembersSub')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={memberChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Bar dataKey="count" fill="#315efb" radius={[4, 4, 0, 0]} name={t('communityDashboard.analytics.seriesNewMembers')} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title={t('communityDashboard.analytics.chartPosts')} subtitle={t('communityDashboard.analytics.chartPostsSub')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={postsChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name={t('communityDashboard.analytics.seriesPosts')} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title={t('communityDashboard.analytics.chartGrowth')}
            subtitle={t('communityDashboard.analytics.chartGrowthSub')}
            className="lg:col-span-2"
          >
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cumulativeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="memberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#315efb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#315efb" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                  width={32}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#315efb"
                  strokeWidth={2}
                  fill="url(#memberGrad)"
                  name={t('communityDashboard.analytics.seriesTotalMembers')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3 border-t border-neutral-100 pt-6">
        <Link
          to={communityDashboardUsersPath(handle)}
          className="text-sm font-medium text-[#315efb] hover:underline"
        >
          {t('communityDashboard.analytics.linkViewUsers')}
        </Link>
        <Link
          to={communityDashboardContentPath(handle)}
          className="text-sm font-medium text-[#315efb] hover:underline"
        >
          {t('communityDashboard.analytics.linkViewContent')}
        </Link>
        <Link
          to={communityDashboardInvitesPath(handle)}
          className="text-sm font-medium text-[#315efb] hover:underline"
        >
          {t('communityDashboard.analytics.linkInvites')}
        </Link>
        <Link to={communityStorePath(handle)} className="text-sm font-medium text-[#315efb] hover:underline">
          {t('communityDashboard.analytics.linkOpenStore')}
        </Link>
      </div>
    </div>
  );
};

const ChartCard: React.FC<{
  title: string;
  subtitle: string;
  className?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, className = '', children }) => (
  <section className={`rounded-xl border border-neutral-200 p-5 ${className}`}>
    <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
    <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
    <div className="mt-4">{children}</div>
  </section>
);

export default CommunityDashboardAnalytics;
