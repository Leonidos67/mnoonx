import {
  CommunityAdminPermissionKey,
  CommunityAdminPermissions,
  mergeAdminPermissions,
} from '../constants/communityAdminPermissions';
import { isCommunityOwner } from './communityOwner';

export interface CommunityRoleContext {
  isOwner?: boolean;
  isAdmin?: boolean;
  adminPermissions?: Partial<CommunityAdminPermissions> | null;
}

export function getEffectiveAdminPermissions(
  community: CommunityRoleContext
): CommunityAdminPermissions {
  return mergeAdminPermissions(community.adminPermissions);
}

export function canAccessCommunityDashboard(community: CommunityRoleContext): boolean {
  if (community.isOwner === true) return true;
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
