const DEFAULT_ADMIN_PERMISSIONS = {
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

function ownerIdString(community) {
  const o = community?.owner;
  if (!o) return '';
  if (typeof o === 'object' && o._id != null) return o._id.toString();
  return o.toString();
}

function isCommunityOwner(community, userId) {
  if (!userId || !community) return false;
  const ownerId = ownerIdString(community);
  return ownerId !== '' && ownerId === userId.toString();
}

function adminUserId(adminEntry) {
  if (!adminEntry) return '';
  const u = adminEntry.user;
  if (!u) return '';
  if (typeof u === 'object' && u._id != null) return u._id.toString();
  return u.toString();
}

function isCommunityAdmin(community, userId) {
  if (!userId || !community?.admins?.length) return false;
  const uid = userId.toString();
  return community.admins.some((a) => adminUserId(a) === uid);
}

function getAdminPermissions(community) {
  const raw = community.adminPermissions;
  const plain =
    raw && typeof raw.toObject === 'function'
      ? raw.toObject()
      : raw && typeof raw === 'object'
        ? raw
        : {};
  return { ...DEFAULT_ADMIN_PERMISSIONS, ...plain };
}

function hasAdminPermission(community, userId, permissionKey) {
  if (isCommunityOwner(community, userId)) return true;
  if (!isCommunityAdmin(community, userId)) return false;
  return Boolean(getAdminPermissions(community)[permissionKey]);
}

function canAccessCommunityDashboard(community, userId) {
  return hasAdminPermission(community, userId, 'canAccessDashboard');
}

function serializeAdminsList(community) {
  return (community.admins || [])
    .map((entry) => {
      const u = entry.user;
      if (!u || typeof u !== 'object') return null;
      return {
        _id: u._id.toString(),
        username: u.username,
        fullName: u.fullName || u.username,
        avatar: u.avatar || '',
        role: 'Admin',
        addedAt: entry.addedAt,
      };
    })
    .filter(Boolean);
}

module.exports = {
  DEFAULT_ADMIN_PERMISSIONS,
  getAdminPermissions,
  isCommunityAdmin,
  isCommunityOwner,
  hasAdminPermission,
  canAccessCommunityDashboard,
  serializeAdminsList,
  adminUserId,
};
