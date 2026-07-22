const mongoose = require('mongoose');
const User = require('../models/User');
const Conversation = require('../models/Conversation');

function toId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

async function loadBlockedSets(userId, peerUserId) {
  const [user, peer] = await Promise.all([
    User.findById(userId).select('blockedUserIds').lean(),
    User.findById(peerUserId).select('blockedUserIds').lean(),
  ]);
  const myBlocked = new Set((user?.blockedUserIds || []).map((id) => id.toString()));
  const theirBlocked = new Set((peer?.blockedUserIds || []).map((id) => id.toString()));
  return { myBlocked, theirBlocked };
}

async function isBlockedEitherWay(userId, peerUserId) {
  const uid = String(userId);
  const pid = String(peerUserId);
  const { myBlocked, theirBlocked } = await loadBlockedSets(userId, peerUserId);
  return {
    blockedByMe: myBlocked.has(pid),
    blockedByThem: theirBlocked.has(uid),
    blocked: myBlocked.has(pid) || theirBlocked.has(uid),
  };
}

async function assertCanMessage(userId, peerUserId) {
  const { blockedByMe, blockedByThem } = await isBlockedEitherWay(userId, peerUserId);
  if (blockedByMe) {
    const err = new Error('You blocked this user');
    err.status = 403;
    err.code = 'blocked_by_me';
    throw err;
  }
  if (blockedByThem) {
    const err = new Error('This user is unavailable');
    err.status = 403;
    err.code = 'blocked_by_them';
    throw err;
  }
}

async function hideDmConversations(userId, peerUserId) {
  const ownerId = toId(userId);
  const peerId = toId(peerUserId);
  const now = new Date();
  await Conversation.updateOne(
    { ownerUserId: ownerId, kind: 'dm', peerUserId: peerId },
    { $set: { hiddenAt: now } }
  );
}

module.exports = {
  loadBlockedSets,
  isBlockedEitherWay,
  assertCanMessage,
  hideDmConversations,
};
