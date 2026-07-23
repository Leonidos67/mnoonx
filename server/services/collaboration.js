const User = require('../models/User');
const Follow = require('../models/Follow');
const Community = require('../models/Community');
const CollaborationRequest = require('../models/CollaborationRequest');

const PRIVACY_MODES = ['everyone', 'friends', 'request', 'off'];

function normalizePrivacy(value) {
  const v = String(value || 'everyone').toLowerCase();
  return PRIVACY_MODES.includes(v) ? v : 'everyone';
}

async function areFriends(userAId, userBId) {
  const a = String(userAId);
  const b = String(userBId);
  const [ab, ba] = await Promise.all([
    Follow.findOne({ follower: a, following: b }).select('_id').lean(),
    Follow.findOne({ follower: b, following: a }).select('_id').lean(),
  ]);
  return Boolean(ab && ba);
}

/**
 * Can `fromUserId` start a collab with `toUser` (partner)?
 * Returns { ok, mode, action: 'create'|'request'|'deny', code?, message? }
 */
async function evaluateCollaborationInvite(fromUserId, toUser) {
  if (!fromUserId || !toUser) {
    return { ok: false, action: 'deny', code: 'invalid', message: 'Invalid users' };
  }
  const fromId = String(fromUserId);
  const toId = String(toUser._id || toUser);
  if (fromId === toId) {
    return {
      ok: false,
      action: 'deny',
      code: 'self',
      message: 'Choose another user as your collaboration partner',
    };
  }

  const mode = normalizePrivacy(toUser.collaborationPrivacy);
  if (mode === 'off') {
    return {
      ok: false,
      action: 'deny',
      code: 'off',
      message: 'This user is not accepting collaborations',
    };
  }
  if (mode === 'everyone') {
    return { ok: true, action: 'create', mode };
  }
  if (mode === 'friends') {
    const friends = await areFriends(fromId, toId);
    if (!friends) {
      return {
        ok: false,
        action: 'deny',
        code: 'friends_only',
        message: 'Only mutual followers can invite this user to a collaboration',
      };
    }
    return { ok: true, action: 'create', mode };
  }
  // request
  return { ok: true, action: 'request', mode };
}

async function createCollaborationCommunity({
  ownerId,
  coOwnerId,
  name,
  description,
  category = 'Other',
  isPublic = true,
}) {
  const base = String(name || 'collab')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);
  let finalHandle = `collab-${base || 'space'}-${Date.now().toString(36).slice(-4)}`;
  let tries = 0;
  while (tries < 5) {
    const existing = await Community.findOne({ handle: finalHandle }).select('_id').lean();
    if (!existing) break;
    finalHandle = `collab-${base || 'space'}-${Date.now().toString(36).slice(-4)}${tries}`;
    tries += 1;
  }

  const createdAt = new Date();
  const memberIds = [ownerId, coOwnerId];
  const doc = new Community({
    name,
    handle: finalHandle,
    description: description || `Collaboration: ${name}`,
    owner: ownerId,
    kind: 'collaboration',
    coOwner: coOwnerId,
    members: memberIds,
    memberJoins: memberIds.map((userId) => ({ userId, joinedAt: createdAt })),
    memberCount: 2,
    category,
    isPublic,
    createdAt,
  });
  await doc.save();

  await User.findByIdAndUpdate(ownerId, {
    $addToSet: { ownedCommunities: doc._id, joinedCommunities: doc._id },
  });
  await User.findByIdAndUpdate(coOwnerId, {
    $addToSet: { ownedCommunities: doc._id, joinedCommunities: doc._id },
  });

  return Community.findById(doc._id)
    .populate('owner', 'username fullName avatar')
    .populate('coOwner', 'username fullName avatar');
}

async function getInviteStatusForViewer(viewerId, profileUser) {
  if (!viewerId) return { status: 'anonymous', privacy: normalizePrivacy(profileUser.collaborationPrivacy) };
  if (String(viewerId) === String(profileUser._id)) {
    return { status: 'self', privacy: normalizePrivacy(profileUser.collaborationPrivacy) };
  }
  const evalResult = await evaluateCollaborationInvite(viewerId, profileUser);
  const pending = await CollaborationRequest.findOne({
    fromUser: viewerId,
    toUser: profileUser._id,
    status: 'pending',
  })
    .select('_id')
    .lean();

  return {
    status: evalResult.action === 'deny' ? evalResult.code || 'deny' : evalResult.action,
    privacy: evalResult.mode || normalizePrivacy(profileUser.collaborationPrivacy),
    pendingRequestId: pending ? pending._id.toString() : null,
    canInvite: evalResult.ok === true,
    message: evalResult.message || null,
  };
}

module.exports = {
  PRIVACY_MODES,
  normalizePrivacy,
  areFriends,
  evaluateCollaborationInvite,
  createCollaborationCommunity,
  getInviteStatusForViewer,
};
