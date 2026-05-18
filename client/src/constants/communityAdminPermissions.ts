export type CommunityAdminPermissionKey =
  | 'canAccessDashboard'
  | 'canManageMembers'
  | 'canViewAnalytics'
  | 'canManageProducts'
  | 'canManageContent'
  | 'canManageInvites'
  | 'canManagePosts'
  | 'canManageSettings'
  | 'canManageApps';

export type CommunityAdminPermissions = Record<CommunityAdminPermissionKey, boolean>;

export const DEFAULT_COMMUNITY_ADMIN_PERMISSIONS: CommunityAdminPermissions = {
  canAccessDashboard: true,
  canManageMembers: true,
  canViewAnalytics: true,
  canManageProducts: true,
  canManageContent: true,
  canManageInvites: true,
  canManagePosts: true,
  canManageSettings: false,
  canManageApps: false,
};

export const COMMUNITY_ADMIN_PERMISSION_META: {
  key: CommunityAdminPermissionKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'canAccessDashboard',
    label: 'Access dashboard',
    description: 'Open the community owner dashboard.',
  },
  {
    key: 'canManageMembers',
    label: 'Manage members',
    description: 'View and manage the Users section.',
  },
  {
    key: 'canViewAnalytics',
    label: 'View analytics',
    description: 'Open growth and activity analytics.',
  },
  {
    key: 'canManageProducts',
    label: 'Manage products',
    description: 'Edit products and monetization items.',
  },
  {
    key: 'canManageContent',
    label: 'Manage content',
    description: 'Edit courses, files, and other content apps.',
  },
  {
    key: 'canManageInvites',
    label: 'Manage invites',
    description: 'Create and manage invite links.',
  },
  {
    key: 'canManagePosts',
    label: 'Moderate posts',
    description: 'Moderate the community feed and member posts.',
  },
  {
    key: 'canManageSettings',
    label: 'Edit community settings',
    description: 'Change name, visibility, join code, and branding fields.',
  },
  {
    key: 'canManageApps',
    label: 'Manage installed apps',
    description: 'Show or hide apps and edit app visibility on the community page.',
  },
];

export function mergeAdminPermissions(
  partial?: Partial<CommunityAdminPermissions> | null
): CommunityAdminPermissions {
  return { ...DEFAULT_COMMUNITY_ADMIN_PERMISSIONS, ...(partial || {}) };
}
