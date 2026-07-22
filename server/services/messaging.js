const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const ConversationReadState = require('../models/ConversationReadState');
const Notification = require('../models/Notification');

const MNOONX_WELCOME =
  "Welcome to MNOONX!\n\nThousands of internet entrepreneurs like you launch their businesses on MNOONX every day. You're just 3 steps away from joining them:\n\n1. Add apps to your mnoonx\n2. Set up MNOONX Payments\n3. Invite your first user\n\nIf you have any questions, please contact our Support Team.\n\nWe're excited to see what you build!";

const SUPPORT_WELCOME =
  "Hello! I am a Mnoonx support bot. I will be glad to help you.\n\nI can help with organization cards, subscriptions, and other Mnoonx questions.\n\nChoose a topic or write your question in the chat.";

const SYSTEM_KINDS = ['system_mnoonx', 'system_support'];

function toOwnerId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

/** Remove duplicate system inboxes (race on parallel ensureUserMessaging). */
async function dedupeSystemConversations(userId) {
  const ownerId = toOwnerId(userId);
  for (const kind of SYSTEM_KINDS) {
    const all = await Conversation.find({ ownerUserId: ownerId, kind }).sort({ createdAt: 1 });
    if (all.length <= 1) continue;

    const keep = all[0];
    const removeIds = all.slice(1).map((c) => c._id);
    await DirectMessage.deleteMany({ conversationId: { $in: removeIds } });
    await ConversationReadState.deleteMany({ conversationId: { $in: removeIds } });
    await Conversation.deleteMany({ _id: { $in: removeIds } });
  }
}

async function getOrCreateSystemConversation(userId, kind, welcomeBody) {
  const ownerId = toOwnerId(userId);
  let conv = await Conversation.findOne({ ownerUserId: ownerId, kind });
  if (conv) return conv;

  try {
    conv = await Conversation.create({
      ownerUserId: ownerId,
      kind,
      lastMessageText: welcomeBody.slice(0, 120),
      lastMessageAt: new Date(),
      lastMessageSenderType: 'system',
      lastMessageSenderUserId: null,
    });
    await DirectMessage.create({
      conversationId: conv._id,
      senderType: 'system',
      body: welcomeBody,
    });
    return conv;
  } catch (err) {
    if (err && err.code === 11000) {
      conv = await Conversation.findOne({ ownerUserId: ownerId, kind });
      if (conv) return conv;
    }
    throw err;
  }
}

async function ensureUserMessaging(userId) {
  const ownerId = toOwnerId(userId);
  await dedupeSystemConversations(ownerId);

  await getOrCreateSystemConversation(ownerId, 'system_mnoonx', MNOONX_WELCOME);
  await getOrCreateSystemConversation(ownerId, 'system_support', SUPPORT_WELCOME);

  await dedupeSystemConversations(ownerId);

  const existingNotif = await Notification.countDocuments({ userId: ownerId });
  if (existingNotif === 0) {
    await Notification.create([
      {
        userId: ownerId,
        type: 'system',
        title: 'Welcome to MNOONX',
        body: 'Your account is ready. Explore communities and start building.',
        read: false,
        createdAt: new Date(),
      },
      {
        userId: ownerId,
        type: 'mention',
        title: 'Team Mnoonx',
        body: 'Thanks for joining — check Messages for onboarding tips.',
        read: false,
        createdAt: new Date(Date.now() - 3600000),
      },
    ]);
  }
}

const ACTIVE_MESSAGE_FILTER = { deletedAt: null };

async function syncConversationLastMessage(conv) {
  const last = await DirectMessage.findOne({
    conversationId: conv._id,
    ...ACTIVE_MESSAGE_FILTER,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!last) {
    conv.lastMessageText = '';
    conv.lastMessageAt = conv.createdAt || new Date();
    conv.lastMessageSenderType = null;
    conv.lastMessageSenderUserId = null;
  } else {
    conv.lastMessageText = String(last.body).slice(0, 200);
    conv.lastMessageAt = last.createdAt;
    conv.lastMessageSenderType = last.senderType;
    conv.lastMessageSenderUserId = last.senderUserId;
  }
  await conv.save();
}

async function countUnreadMessages(userId) {
  const ownerId = toOwnerId(userId);
  const convs = await Conversation.find({ ownerUserId: ownerId, hiddenAt: null }).lean();
  if (!convs.length) return 0;

  const readStates = await ConversationReadState.find({
    userId: ownerId,
    conversationId: { $in: convs.map((c) => c._id) },
  }).lean();
  const readMap = new Map(readStates.map((r) => [r.conversationId.toString(), r.lastReadAt]));

  let total = 0;
  for (const conv of convs) {
    const lastRead = readMap.get(conv._id.toString()) || null;
    const q = { conversationId: conv._id, ...ACTIVE_MESSAGE_FILTER };
    if (conv.kind === 'dm') {
      q.senderType = 'user';
      q.senderUserId = conv.peerUserId;
    } else {
      q.senderType = 'system';
    }
    if (lastRead) q.createdAt = { $gt: lastRead };
    total += await DirectMessage.countDocuments(q);
  }
  return total;
}

async function getOrCreateDmConversation(userId, peerUserId) {
  const ownerId = toOwnerId(userId);
  const peerId = toOwnerId(peerUserId);

  let convA = await Conversation.findOne({
    ownerUserId: ownerId,
    kind: 'dm',
    peerUserId: peerId,
  });
  let convB = await Conversation.findOne({
    ownerUserId: peerId,
    kind: 'dm',
    peerUserId: ownerId,
  });

  if (!convA) {
    convA = await Conversation.create({
      ownerUserId: ownerId,
      kind: 'dm',
      peerUserId: peerId,
      lastMessageText: '',
      lastMessageAt: new Date(),
    });
  } else if (convA.hiddenAt) {
    convA.hiddenAt = null;
    await convA.save();
  }
  if (!convB) {
    convB = await Conversation.create({
      ownerUserId: peerId,
      kind: 'dm',
      peerUserId: ownerId,
      lastMessageText: '',
      lastMessageAt: new Date(),
    });
  } else if (convB.hiddenAt) {
    convB.hiddenAt = null;
    await convB.save();
  }

  return { convA, convB };
}

module.exports = {
  ensureUserMessaging,
  dedupeSystemConversations,
  countUnreadMessages,
  getOrCreateDmConversation,
  syncConversationLastMessage,
  ACTIVE_MESSAGE_FILTER,
  MNOONX_WELCOME,
  SUPPORT_WELCOME,
};
