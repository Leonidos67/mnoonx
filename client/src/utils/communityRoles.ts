import {
  CommunityAdminPermissionKey,
  CommunityAdminPermissions,
  mergeAdminPermissions,
} from '../constants/communityAdminPermissions';
import { isCommunityOwner } from './communityOwner';

export interface CommunityRoleContext {
  isOwner?: boolean;
  isAdmin?: boolean;
  kind?: 'community' | 'collaboration' | string;
  adminPermissions?: Partial<CommunityAdminPermissions> | null;
}

export function getEffectiveAdminPermissions(
  community: CommunityRoleContext
): CommunityAdminPermissions {
  return mergeAdminPermissions(community.adminPermissions);
}

export function canAccessCommunityDashboard(community: CommunityRoleContext): boolean {
  // Collaborations have no owner dashboard
  if (community.kind === 'collaboration') return false;
  if (community.isOwner === true) return true;
  if (!community.isAdmin) return false;
  return getEffectiveAdminPermissions(community).canAccessDashboard;
}

/** Settings / store — owners and collab co-creators (not dashboard-gated). */
export function canManageCommunitySettings(
  community: CommunityRoleContext & {
    owner?: { _id?: string } | string | null;
    coOwner?: { _id?: string } | string | null;
  },
  userId: string | undefined | null
): boolean {
  if (community.isOwner === true) return true;
  if (isCommunityOwner(community, userId)) return true;
  if (community.kind === 'collaboration') return false;
  if (!community.isAdmin) return false;
  return getEffectiveAdminPermissions(community).canAccessDashboard;
}

export function hasCommunityPermission(
  community: CommunityRoleContext,
  userId: string | undefined | null,
  permission: CommunityAdminPermissionKey
): boolean {
  if (isCommunityOwner(community, userId) || community.isOwner === true) return true;
  if (!community.isAdmin) return false;
  return Boolean(getEffectiveAdminPermissions(community)[permission]);
}
