/** Сегмент URL страницы настроек сообщества */
export const COMMUNITY_SETTINGS_SEGMENT = 'settings';

export const communityPath = (handle: string) => `/community/${encodeURIComponent(handle)}`;

export const communitySettingsPath = (handle: string) =>
  `/community/${encodeURIComponent(handle)}/${COMMUNITY_SETTINGS_SEGMENT}`;

export const COMMUNITY_STORE_SEGMENT = 'store';

export const communityStorePath = (handle: string) =>
  `/community/${encodeURIComponent(handle)}/${COMMUNITY_STORE_SEGMENT}`;

/** Owner dashboard (English UI) */
export const communityDashboardPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}`;

export const communityDashboardSettingsPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}/settings`;

export const communityDashboardUsersPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}/users`;

export const communityDashboardProductsPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}/products`;

export const communityDashboardContentPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}/content`;

export const communityDashboardAnalyticsPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}/analytics`;

export const communityDashboardInvitesPath = (handle: string) =>
  `/dashboard/${encodeURIComponent(handle)}/invites`;
