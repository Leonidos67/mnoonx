import React, { useMemo } from 'react';
import { Link, NavLink, Outlet, type NavLinkProps } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  House,
  Users,
  ShoppingBag,
  FileText,
  BarChart3,
  Link2,
  Settings,
  ExternalLink,
} from 'lucide-react';
import {
  communityDashboardPath,
  communityDashboardProductsPath,
  communityDashboardSettingsPath,
  communityDashboardUsersPath,
  communityDashboardContentPath,
  communityDashboardAnalyticsPath,
  communityDashboardInvitesPath,
  communityPath,
} from '../../../constants/communityRoutes';
import { CommunityDashboardProvider, useCommunityDashboard } from '../../../context/CommunityDashboardContext';
import { hasCommunityPermission } from '../../../utils/communityRoles';
import type { CommunityAdminPermissionKey } from '../../../constants/communityAdminPermissions';
import { useTranslation } from '../../../i18n/useTranslation';

type DashboardNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
};

const sidebarNavClass = ({ isActive }: { isActive: boolean }) =>
  `flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
    isActive ? 'bg-[#eef2ff] text-[#315efb]' : 'text-neutral-700 hover:bg-neutral-100'
  }`;

const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
  `relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'text-[#315efb]' : 'text-neutral-600 hover:text-neutral-900'
  }`;

const DashboardNavLinks: React.FC<{
  items: DashboardNavItem[];
  className: NavLinkProps['className'];
  iconClassName?: string;
}> = ({ items, className, iconClassName = 'h-4 w-4 shrink-0' }) => (
  <>
    {items.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={className}
        >
          <Icon className={iconClassName} aria-hidden />
          {item.label}
        </NavLink>
      );
    })}
  </>
);

const DashboardShell: React.FC = () => {
  const { handle, community, loading, error } = useCommunityDashboard();
  const { t } = useTranslation();

  const can = (permission: CommunityAdminPermissionKey) =>
    community ? hasCommunityPermission(community, null, permission) : false;

  const navItems = useMemo((): DashboardNavItem[] => {
    if (!community) return [];
    const items: DashboardNavItem[] = [
      { to: communityDashboardPath(handle), end: true, label: t('communityDashboard.nav.home'), icon: House },
    ];
    if (can('canManageMembers')) {
      items.push({ to: communityDashboardUsersPath(handle), label: t('communityDashboard.nav.users'), icon: Users });
    }
    if (can('canManageProducts')) {
      items.push({
        to: communityDashboardProductsPath(handle),
        label: t('communityDashboard.nav.products'),
        icon: ShoppingBag,
      });
    }
    if (can('canManageContent')) {
      items.push({ to: communityDashboardContentPath(handle), label: t('communityDashboard.nav.content'), icon: FileText });
    }
    if (can('canViewAnalytics')) {
      items.push({
        to: communityDashboardAnalyticsPath(handle),
        label: t('communityDashboard.nav.analytics'),
        icon: BarChart3,
      });
    }
    if (can('canManageInvites')) {
      items.push({ to: communityDashboardInvitesPath(handle), label: t('communityDashboard.nav.invites'), icon: Link2 });
    }
    if (community.isOwner || can('canManageSettings')) {
      items.push({
        to: communityDashboardSettingsPath(handle),
        label: t('communityDashboard.nav.settings'),
        icon: Settings,
      });
    }
    return items;
  }, [community, handle, t]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="flex min-h-full items-center justify-center bg-white px-4">
        <p className="text-sm text-red-600">{error || t('communityDashboard.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="border-b border-neutral-100 p-2">
          <Link
            to={communityPath(community.handle)}
            className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-neutral-50"
          >
            <img
              src={
                community.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=000&color=fff&size=40&bold=true`
              }
              alt=""
              className="h-10 w-10 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{community.name}</p>
              <p className="truncate text-xs text-neutral-500">@{community.handle}</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-1">
          <DashboardNavLinks items={navItems} className={sidebarNavClass} />
        </nav>
      </aside>

      {/* Mobile: community row + horizontal nav */}
      <header className="shrink-0 border-b border-neutral-200 bg-white lg:hidden">
        <div className="border-b border-neutral-100 px-3 py-2">
          <Link
            to={communityPath(community.handle)}
            className="flex items-center gap-2.5 rounded-lg py-0.5 transition-colors active:bg-neutral-50"
          >
            <img
              src={
                community.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(community.name)}&background=000&color=fff&size=36&bold=true`
              }
              alt=""
              className="h-9 w-9 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-neutral-900">{community.name}</p>
              <p className="truncate text-xs text-neutral-500">@{community.handle}</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          </Link>
        </div>

        <nav
          className="flex gap-0.5 overflow-x-auto px-2 scrollbar-thin scrollbar-thumb-neutral-200"
          aria-label={t('communityDashboard.navAria')}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={mobileNavClass}
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                    {isActive ? (
                      <span
                        className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[#315efb]"
                        aria-hidden
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
};

const CommunityDashboardLayout: React.FC = () => (
  <CommunityDashboardProvider>
    <DashboardShell />
  </CommunityDashboardProvider>
);

export default CommunityDashboardLayout;
