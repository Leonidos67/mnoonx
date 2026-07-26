import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  LayoutGrid,
  Globe,
  Lock,
  FileText,
  MessageCircle,
  EyeOff,
  Copy,
  ExternalLink,
  Store,
  Settings,
  AlertCircle,
  ChevronRight,
  DollarSign,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunityDashboard } from '../../context/CommunityDashboardContext';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import { formatUsd, useDashboardAnalytics } from '../../hooks/useDashboardAnalytics';
import { dashboardAppIcon, getDashboardAppLabel } from '../../components/Community/Dashboard/dashboardAppMeta';
import { useTranslation } from '../../i18n/useTranslation';
import { communityCategoryLabel } from '../../constants/communityCategories';
import {
  communityPath,
  communityDashboardAnalyticsPath,
  communityDashboardContentPath,
  communityDashboardProductsPath,
  communityDashboardSettingsPath,
  communityDashboardUsersPath,
  communityStorePath,
} from '../../constants/communityRoutes';

const CommunityDashboardHome: React.FC = () => {
  const { handle, community } = useCommunityDashboard();
  const { token } = useAuth();
  const { t } = useTranslation();
  const { postCount, totalChatUnread, loading: overviewLoading } = useDashboardOverview(
    handle,
    token
  );
  const { data: analytics, loading: analyticsLoading } = useDashboardAnalytics(handle, token);

  const attentionItems = useMemo(() => {
    if (!community) return [];
    const apps = community.installedAppInstances ?? [];
    const hiddenApps = apps.filter((a) => a.visibleToMembers === false);
    const appCount = apps.length;
    const isPublic = community.isPublic !== false;
    const membersCanPost = community.membersCanPost !== false;
    const hasJoinCode = Boolean(community.joinCode?.trim());

    const items: { id: string; message: string; href: string; label: string }[] = [];
    if (totalChatUnread > 0) {
      items.push({
        id: 'chat',
        message: t(
          totalChatUnread === 1
            ? 'communityDashboard.home.attentionUnreadChat'
            : 'communityDashboard.home.attentionUnreadChatMany',
          { count: totalChatUnread }
        ),
        href: communityPath(community.handle),
        label: t('communityDashboard.home.actionOpenCommunity'),
      });
    }
    if (hiddenApps.length > 0) {
      items.push({
        id: 'hidden-apps',
        message: t(
          hiddenApps.length === 1
            ? 'communityDashboard.home.attentionHiddenApps'
            : 'communityDashboard.home.attentionHiddenAppsMany',
          { count: hiddenApps.length }
        ),
        href: communityDashboardProductsPath(handle),
        label: t('communityDashboard.home.actionManageProducts'),
      });
    }
    if (!isPublic && !hasJoinCode) {
      items.push({
        id: 'join-code',
        message: t('communityDashboard.home.attentionNoPassphrase'),
        href: communityDashboardSettingsPath(handle),
        label: t('communityDashboard.home.actionAddPassphrase'),
      });
    }
    if (!membersCanPost) {
      items.push({
        id: 'posts-locked',
        message: t('communityDashboard.home.attentionPostsLocked'),
        href: communityDashboardSettingsPath(handle),
        label: t('communityDashboard.home.actionReviewSettings'),
      });
    }
    if (appCount === 0) {
      items.push({
        id: 'no-apps',
        message: t('communityDashboard.home.attentionNoApps'),
        href: communityStorePath(handle),
        label: t('communityDashboard.home.openStore'),
      });
    }
    if (postCount === 0 && !overviewLoading) {
      items.push({
        id: 'no-posts',
        message: t('communityDashboard.home.attentionFeedEmpty'),
        href: communityPath(community.handle),
        label: t('communityDashboard.home.actionViewFeed'),
      });
    }
    return items;
  }, [community, totalChatUnread, postCount, overviewLoading, handle, t]);

  if (!community) return null;

  const apps = community.installedAppInstances ?? [];
  const appCount = apps.length;
  const isPublic = community.isPublic !== false;

  const inviteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${communityPath(community.handle)}`
      : communityPath(community.handle);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-full bg-white p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-neutral-900">{t('dashboard.title')}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t('communityDashboard.home.overviewFor', { name: community.name })}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={<Users className="h-4 w-4" aria-hidden />}
          label={t('communityDashboard.home.members')}
          value={String(community.memberCount)}
          href={communityDashboardUsersPath(handle)}
          linkLabel={t('communityDashboard.home.viewUsers')}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" aria-hidden />}
          label={t('communityDashboard.home.feedPosts')}
          value={overviewLoading ? '…' : String(postCount)}
          href={communityDashboardContentPath(handle)}
          linkLabel={t('communityDashboard.home.manageContent')}
        />
        <StatCard
          icon={<LayoutGrid className="h-4 w-4" aria-hidden />}
          label={t('communityDashboard.home.installedApps')}
          value={String(appCount)}
          href={communityStorePath(handle)}
          linkLabel={t('communityDashboard.home.openStore')}
        />
        <StatCard
          icon={<MessageCircle className="h-4 w-4" aria-hidden />}
          label={t('communityDashboard.home.unreadChat')}
          value={overviewLoading ? '…' : String(totalChatUnread)}
          href={communityPath(community.handle)}
          linkLabel={t('communityDashboard.home.openChat')}
        />
        <StatCard
          icon={<UserPlus className="h-4 w-4" aria-hidden />}
          label={t('communityDashboard.home.newMembers7d')}
          value={analyticsLoading ? '…' : String(analytics?.summary.newMembers7d ?? 0)}
          href={communityDashboardAnalyticsPath(handle)}
          linkLabel={t('communityDashboard.home.viewAnalytics')}
        />
        {community.isPaid ? (
          <StatCard
            icon={<DollarSign className="h-4 w-4" aria-hidden />}
            label={t('communityDashboard.home.estRevenue')}
            value={
              analyticsLoading ? '…' : formatUsd(analytics?.summary.estimatedRevenue ?? 0)
            }
            href={communityDashboardAnalyticsPath(handle)}
            linkLabel={t('communityDashboard.home.viewAnalytics')}
          />
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900">{t('communityDashboard.home.quickActions')}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <QuickAction href={communityPath(community.handle)} icon={<ExternalLink className="h-4 w-4" />}>
              {t('communityDashboard.home.viewCommunity')}
            </QuickAction>
            <button type="button" onClick={() => void copyInvite()} className={quickActionClass}>
              <Copy className="h-4 w-4" aria-hidden />
              {t('communityDashboard.home.copyInviteLink')}
            </button>
            <QuickAction href={communityStorePath(handle)} icon={<Store className="h-4 w-4" />}>
              {t('communityDashboard.home.openStore')}
            </QuickAction>
            <QuickAction href={communityDashboardSettingsPath(handle)} icon={<Settings className="h-4 w-4" />}>
              {t('communityDashboard.home.settings')}
            </QuickAction>
            <QuickAction href={communityDashboardContentPath(handle)} icon={<FileText className="h-4 w-4" />}>
              {t('communityDashboard.nav.content')}
            </QuickAction>
          </div>
        </section>

        <section className="rounded-xl border border-neutral-200 p-5">
          <h2 className="text-sm font-semibold text-neutral-900">{t('communityDashboard.home.needsAttention')}</h2>
          {attentionItems.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">{t('communityDashboard.home.allGood')}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {attentionItems.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-sm transition-colors hover:bg-amber-50"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-amber-950">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.message}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#315efb]">
                      {item.label}
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-neutral-900">{t('communityDashboard.home.installedAppsHeading')}</h2>
          <Link
            to={communityDashboardProductsPath(handle)}
            className="text-sm font-medium text-[#315efb] hover:underline"
          >
            {t('communityDashboard.home.manageAll')}
          </Link>
        </div>
        {apps.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            {t('communityDashboard.home.noAppsYet')}{' '}
            <Link to={communityStorePath(handle)} className="font-medium text-[#315efb] hover:underline">
              {t('communityDashboard.home.browseStore')}
            </Link>
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500">
                  <th className="whitespace-nowrap pb-2 pr-4 font-medium">{t('communityDashboard.home.colApp')}</th>
                  <th className="whitespace-nowrap pb-2 pr-4 font-medium">{t('communityDashboard.home.colType')}</th>
                  <th className="whitespace-nowrap pb-2 font-medium">{t('communityDashboard.home.colVisibility')}</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => {
                  const Icon = dashboardAppIcon(app.appId);
                  const visible = app.visibleToMembers !== false;
                  return (
                    <tr key={app.id} className="border-b border-neutral-100 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="flex items-center gap-2 font-medium text-neutral-900">
                          <Icon className="h-4 w-4 text-neutral-500" aria-hidden />
                          {app.title}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-neutral-600">{getDashboardAppLabel(app.appId, t)}</td>
                      <td className="py-3">
                        {visible ? (
                          <span className="inline-flex rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                            {t('communityDashboard.visible')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                            <EyeOff className="h-3 w-3" aria-hidden />
                            {t('communityDashboard.hidden')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
          {isPublic ? t('common.public') : t('common.private')} ·{' '}
          {communityCategoryLabel(community.category, t)}
        </span>
        {community.isPaid && (
          <span>
            {t('communityDashboard.paidAccessLine', {
              price: typeof community.price === 'number' ? community.price.toFixed(2) : '0',
            })}
          </span>
        )}
      </div>
    </div>
  );
};

const quickActionClass =
  'inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50';

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  href: string;
  linkLabel: string;
}> = ({ icon, label, value, href, linkLabel }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
    <div className="flex items-center gap-2 text-neutral-500">
      {icon}
      <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
    </div>
    <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
    <Link to={href} className="mt-3 inline-block text-sm font-medium text-[#315efb] hover:underline">
      {linkLabel}
    </Link>
  </div>
);

const QuickAction: React.FC<{
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ href, icon, children }) => (
  <Link to={href} className={quickActionClass}>
    {icon}
    {children}
  </Link>
);

export default CommunityDashboardHome;
