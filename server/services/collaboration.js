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

/**
 * Resolve a community the user owns (non-collaboration) by id or handle.
 * Returns ObjectId or null. Throws on invalid ownership.
 */
async function resolveOwnedDisplayCommunity(userId, communityIdOrHandle) {
  if (communityIdOrHandle == null || communityIdOrHandle === '' || communityIdOrHandle === 'user') {
    return null;
  }
  const raw = String(communityIdOrHandle).trim();
  const filter = {
    kind: { $ne: 'collaboration' },
    owner: userId,
  };
  if (/^[a-f\d]{24}$/i.test(raw)) {
    filter._id = raw;
  } else {
    filter.handle = raw.toLowerCase().replace(/^@/, '');
  }
  const doc = await Community.findOne(filter).select('_id').lean();
  if (!doc) {
    const err = new Error('Display community must be owned by that creator and not be a collaboration');
    err.code = 'invalid_display_community';
    throw err;
  }
  return doc._id;
}

function serializeCreatorFace(userDoc, communityDoc) {
  if (!userDoc) return null;
  const userId = userDoc._id ? String(userDoc._id) : String(userDoc);
  const username = userDoc.username || '';
  if (communityDoc && communityDoc.handle) {
    return {
      type: 'community',
      name: communityDoc.name,
      handle: communityDoc.handle,
      avatar: communityDoc.avatar || '',
      userId,
      username,
      fullName: userDoc.fullName || username,
    };
  }
  return {
    type: 'user',
    name: userDoc.fullName || username,
    handle: username,
    avatar: userDoc.avatar || '',
    userId,
    username,
    fullName: userDoc.fullName || username,
  };
}

function attachCollaborationFaces(obj, community) {
  if (!obj || community.kind !== 'collaboration') return obj;
  const ownerUser = community.owner;
  const coUser = community.coOwner;
  const ownerComm = community.ownerDisplayCommunity;
  const coComm = community.coOwnerDisplayCommunity;
  obj.ownerFace = serializeCreatorFace(
    ownerUser && typeof ownerUser === 'object' ? ownerUser : null,
    ownerComm && typeof ownerComm === 'object' && ownerComm.handle ? ownerComm : null
  );
  obj.coOwnerFace = serializeCreatorFace(
    coUser && typeof coUser === 'object' ? coUser : null,
    coComm && typeof coComm === 'object' && coComm.handle ? coComm : null
  );
  return obj;
}

const COLLAB_POPULATE = [
  { path: 'owner', select: 'username fullName avatar' },
  { path: 'coOwner', select: 'username fullName avatar' },
  { path: 'ownerDisplayCommunity', select: 'name handle avatar kind' },
  { path: 'coOwnerDisplayCommunity', select: 'name handle avatar kind' },
];

async function populateCollaboration(docOrId) {
  const id = docOrId._id || docOrId;
  return Community.findById(id).populate(COLLAB_POPULATE);
}

async function createCollaborationCommunity({
  ownerId,
  coOwnerId,
  name,
  description,
  category = 'Other',
  isPublic = true,
  ownerDisplayCommunityId = null,
  coOwnerDisplayCommunityId = null,
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
    ownerDisplayCommunity: ownerDisplayCommunityId || null,
    coOwnerDisplayCommunity: coOwnerDisplayCommunityId || null,
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

  return populateCollaboration(doc._id);
}

/** Swap primary owner ↔ coOwner (and their display communities). */
async function swapCollaborationCreators(community) {
  if (!community || community.kind !== 'collaboration') {
    const err = new Error('Not a collaboration');
    err.code = 'not_collaboration';
    throw err;
  }
  const coId = community.coOwner;
  if (!coId) {
    const err = new Error('Collaboration has no co-owner');
    err.code = 'no_coowner';
    throw err;
  }
  const prevOwner = community.owner;
  const prevOwnerFace = community.ownerDisplayCommunity;
  community.owner = coId;
  community.coOwner = prevOwner;
  community.ownerDisplayCommunity = community.coOwnerDisplayCommunity;
  community.coOwnerDisplayCommunity = prevOwnerFace;
  await community.save();
  return populateCollaboration(community._id);
}

async function setCollaborationCreatorFaces(community, { ownerDisplayCommunityId, coOwnerDisplayCommunityId }) {
  if (!community || community.kind !== 'collaboration') {
    const err = new Error('Not a collaboration');
    err.code = 'not_collaboration';
    throw err;
  }
  if (ownerDisplayCommunityId !== undefined) {
    community.ownerDisplayCommunity = ownerDisplayCommunityId
      ? await resolveOwnedDisplayCommunity(community.owner, ownerDisplayCommunityId)
      : null;
  }
  if (coOwnerDisplayCommunityId !== undefined) {
    if (!community.coOwner) {
      const err = new Error('Collaboration has no co-owner');
      err.code = 'no_coowner';
      throw err;
    }
    community.coOwnerDisplayCommunity = coOwnerDisplayCommunityId
      ? await resolveOwnedDisplayCommunity(community.coOwner, coOwnerDisplayCommunityId)
      : null;
  }
  await community.save();
  return populateCollaboration(community._id);
}

async function listOwnedCommunitiesForUser(userId) {
  return Community.find({
    owner: userId,
    kind: { $ne: 'collaboration' },
  })
    .sort({ memberCount: -1, createdAt: -1 })
    .select('name handle avatar memberCount')
    .limit(40)
    .lean();
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
  swapCollaborationCreators,
  setCollaborationCreatorFaces,
  resolveOwnedDisplayCommunity,
  attachCollaborationFaces,
  populateCollaboration,
  listOwnedCommunitiesForUser,
  COLLAB_POPULATE,
  getInviteStatusForViewer,
};
