/** True when the signed-in user owns the community. */
export function isCommunityOwner(
  community: { isOwner?: boolean; owner?: { _id?: string } | string | null },
  userId: string | undefined | null
): boolean {
  if (!userId) return false;
  if (community.isOwner === true) return true;
  const owner = community.owner;
  const ownerId =
    owner != null && typeof owner === 'object' && owner._id != null
      ? String(owner._id)
      : owner != null
        ? String(owner)
        : '';
  return ownerId !== '' && ownerId === String(userId);
}
