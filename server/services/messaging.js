const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const ConversationReadState = require('../models/ConversationReadState');
const Notification = require('../models/Notification');
const { getRootWelcome, resolveNode } = require('./supportBot');

const MNOONX_WELCOME =
  "Welcome to MNOONX!\n\nThousands of internet entrepreneurs like you launch their businesses on MNOONX every day. You're just 3 steps away from joining them:\n\n1. Add apps to your mnoonx\n2. Set up MNOONX Payments\n3. Invite your first user\n\nIf you have any questions, please contact our Support Team.\n\nWe're excited to see what you build!";

function supportWelcomePayload(locale = 'en') {
  const root = getRootWelcome(locale);
  return {
    body: root.body,
    meta: {
      nodeId: root.nodeId,
      actions: root.actions,
      expectInput: null,
      ticketCategory: null,
    },
  };
}

const SUPPORT_WELCOME = supportWelcomePayload('en').body;

const SYSTEM_KINDS = ['system_mnoonx', 'system_support'];

/** Coalesce parallel ensureUserMessaging calls for the same user (same process). */
const ensureUserMessagingInFlight = new Map();

const WELCOME_SEED_NOTIFICATIONS = [
  {
    seedKey: 'welcome',
    type: 'system',
    title: 'Welcome to MNOONX',
    body: 'Your account is ready. Explore communities and start building.',
    link: '',
    createdAtOffsetMs: 0,
  },
  {
    seedKey: 'two_factor',
    type: 'system',
    title: 'Protect your account',
    body: 'We recommend enabling two-factor authentication in Settings → Security.',
    link: '/settings?section=security',
    createdAtOffsetMs: -1800000,
  },
  {
    seedKey: 'team_onboarding',
    type: 'mention',
    title: 'Team Mnoonx',
    body: 'Thanks for joining — check Messages for onboarding tips.',
    link: '',
    createdAtOffsetMs: -3600000,
  },
];

function toOwnerId(userId) {
  if (userId instanceof mongoose.Types.ObjectId) return userId;
  return new mongoose.Types.ObjectId(String(userId));
}

/**
 * Idempotent welcome seeds: upsert by seedKey and remove title duplicates
 * left by older races (count===0 + parallel unread/list).
 */
async function ensureWelcomeNotifications(ownerId) {
  const now = Date.now();

  for (const seed of WELCOME_SEED_NOTIFICATIONS) {
    const existing = await Notification.find({
      userId: ownerId,
      $or: [{ seedKey: seed.seedKey }, { title: seed.title }],
    }).sort({ createdAt: 1 });

    if (existing.length === 0) {
      try {
        await Notification.create({
          userId: ownerId,
          seedKey: seed.seedKey,
          type: seed.type,
          title: seed.title,
          body: seed.body,
          link: seed.link || '',
          read: false,
          createdAt: new Date(now + seed.createdAtOffsetMs),
        });
      } catch (err) {
        if (!err || err.code !== 11000) throw err;
      }
      continue;
    }

    const [keep, ...dupes] = existing;
    const patch = {};
    if (keep.seedKey !== seed.seedKey) patch.seedKey = seed.seedKey;
    if (seed.link && keep.link !== seed.link) patch.link = seed.link;
    if (Object.keys(patch).length) {
      await Notification.updateOne({ _id: keep._id }, { $set: patch });
    }
    if (dupes.length) {
      await Notification.deleteMany({ _id: { $in: dupes.map((d) => d._id) } });
    }
  }
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

async function getOrCreateSystemConversation(userId, kind, welcomeBody, welcomeMeta = null) {
  const ownerId = toOwnerId(userId);
  let conv = await Conversation.findOne({ ownerUserId: ownerId, kind });
  if (conv) {
    if (kind === 'system_support') {
      await ensureSupportBotMeta(conv, welcomeBody, welcomeMeta);
    }
    return conv;
  }

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
      meta: welcomeMeta || null,
    });
    return conv;
  } catch (err) {
    if (err && err.code === 11000) {
      conv = await Conversation.findOne({ ownerUserId: ownerId, kind });
      if (conv) {
        if (kind === 'system_support') {
          await ensureSupportBotMeta(conv, welcomeBody, welcomeMeta);
        }
        return conv;
      }
    }
    throw err;
  }
}

/** Attach root bot buttons if the support chat has no active action buttons. */
async function ensureSupportBotMeta(conv, welcomeBody, welcomeMeta) {
  if (!welcomeMeta?.actions?.length) return;

  const active = await DirectMessage.findOne({
    conversationId: conv._id,
    senderType: 'system',
    deletedAt: null,
    'meta.actions.0': { $exists: true },
    $or: [{ 'meta.consumed': { $exists: false } }, { 'meta.consumed': false }],
  }).sort({ createdAt: -1 });
  if (active) return;

  const msgCount = await DirectMessage.countDocuments({
    conversationId: conv._id,
    deletedAt: null,
  });

  if (msgCount <= 1) {
    const first = await DirectMessage.findOne({
      conversationId: conv._id,
      senderType: 'system',
      deletedAt: null,
    }).sort({ createdAt: 1 });
    if (first) {
      first.body = welcomeBody;
      first.meta = welcomeMeta;
      await first.save();
      return;
    }
  }

  const auto = await DirectMessage.create({
    conversationId: conv._id,
    senderType: 'system',
    body: welcomeBody,
    meta: welcomeMeta,
  });
  conv.lastMessageText = welcomeBody.slice(0, 200);
  conv.lastMessageAt = auto.createdAt;
  conv.lastMessageSenderType = 'system';
  conv.lastMessageSenderUserId = null;
  await conv.save();
}

async function ensureUserMessaging(userId, locale = 'en', options = {}) {
  const { refreshBotLocale = false } = options;
  const key = String(userId);
  const inFlight = ensureUserMessagingInFlight.get(key);
  if (inFlight) return inFlight;

  const run = (async () => {
    const ownerId = toOwnerId(userId);
    await dedupeSystemConversations(ownerId);

    await getOrCreateSystemConversation(ownerId, 'system_mnoonx', MNOONX_WELCOME);
    const support = supportWelcomePayload(locale);
    await getOrCreateSystemConversation(ownerId, 'system_support', support.body, support.meta);
    if (refreshBotLocale) {
      await refreshSupportBotLocale(ownerId, locale);
    }

    await dedupeSystemConversations(ownerId);
    await ensureWelcomeNotifications(ownerId);
  })().finally(() => {
    ensureUserMessagingInFlight.delete(key);
  });

  ensureUserMessagingInFlight.set(key, run);
  return run;
}

/** Re-localize the latest active support bot message (buttons + body) for the UI language. */
async function refreshSupportBotLocale(ownerId, locale) {
  const conv = await Conversation.findOne({ ownerUserId: ownerId, kind: 'system_support' });
  if (!conv) return;
  const active = await DirectMessage.findOne({
    conversationId: conv._id,
    senderType: 'system',
    deletedAt: null,
    'meta.nodeId': { $exists: true },
    $or: [{ 'meta.consumed': { $exists: false } }, { 'meta.consumed': false }],
  }).sort({ createdAt: -1 });
  if (!active?.meta?.nodeId || active.meta.nodeId === 'ticket_created') return;

  const resolved = resolveNode(active.meta.nodeId, locale);
  if (!resolved) return;

  active.body = resolved.body;
  active.meta = {
    ...active.meta,
    actions: resolved.actions || [],
    expectInput: resolved.expectInput || null,
    ticketCategory: resolved.ticketCategory || null,
  };
  active.markModified('meta');
  await active.save();

  const latest = await DirectMessage.findOne({
    conversationId: conv._id,
    deletedAt: null,
  })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean();
  if (latest && String(latest._id) === String(active._id)) {
    conv.lastMessageText = resolved.body.slice(0, 200);
    await conv.save();
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
