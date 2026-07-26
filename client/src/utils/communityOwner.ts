/** True when the signed-in user owns the community (or is collab co-owner). */
export function isCommunityOwner(
  community: {
    isOwner?: boolean;
    kind?: string;
    owner?: { _id?: string } | string | null;
    coOwner?: { _id?: string } | string | null;
  },
  userId: string | undefined | null
): boolean {
  if (!userId) return false;
  if (community.isOwner === true) return true;
  const uid = String(userId);

  const resolveId = (value: { _id?: string } | string | null | undefined) => {
    if (value == null) return '';
    if (typeof value === 'object' && value._id != null) return String(value._id);
    return String(value);
  };

  const ownerId = resolveId(community.owner);
  if (ownerId !== '' && ownerId === uid) return true;

  if (community.kind === 'collaboration') {
    const coId = resolveId(community.coOwner);
    if (coId !== '' && coId === uid) return true;
  }

  return false;
}
