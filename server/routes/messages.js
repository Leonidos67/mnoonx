const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const ConversationReadState = require('../models/ConversationReadState');
const User = require('../models/User');
const auth = require('../middleware/auth');
const {
  ensureUserMessaging,
  countUnreadMessages,
  getOrCreateDmConversation,
} = require('../services/messaging');

router.use(auth);
router.use((req, res, next) => {
  if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
  next();
});

function displayNameForKind(kind) {
  if (kind === 'system_mnoonx') return 'Team Mnoonx';
  if (kind === 'system_support') return 'Mnoonx Support';
  return 'Chat';
}

function avatarForKind(kind, peer) {
  if (kind === 'system_mnoonx') {
    return 'https://ui-avatars.com/api/?background=000000&color=fff&name=MN';
  }
  if (kind === 'system_support') {
    return 'https://ui-avatars.com/api/?background=6366f1&color=fff&name=MS';
  }
  if (peer?.avatar) return peer.avatar;
  const name = peer?.fullName || peer?.username || 'U';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000&color=fff&bold=true`;
}

async function unreadCountForConversation(conv, userId) {
  const state = await ConversationReadState.findOne({
    conversationId: conv._id,
    userId,
  }).lean();
  const lastRead = state?.lastReadAt || null;
  const q = { conversationId: conv._id };
  if (conv.kind === 'dm') {
    q.senderType = 'user';
    q.senderUserId = conv.peerUserId;
  } else {
    q.senderType = 'system';
  }
  if (lastRead) q.createdAt = { $gt: lastRead };
  return DirectMessage.countDocuments(q);
}

/** When the recipient last read messages in their inbox copy of this DM. */
async function getPeerLastReadAt(ownerUserId, peerUserId) {
  const peerConv = await Conversation.findOne({
    ownerUserId: peerUserId,
    kind: 'dm',
    peerUserId: ownerUserId,
  })
    .select('_id')
    .lean();
  if (!peerConv) return null;

  const state = await ConversationReadState.findOne({
    conversationId: peerConv._id,
    userId: peerUserId,
  })
    .select('lastReadAt')
    .lean();

  return state?.lastReadAt || null;
}

function resolveOutboundMessageStatus(conv, peerLastReadAt, messageCreatedAt) {
  if (conv.kind !== 'dm' || !conv.peerUserId) {
    return 'delivered';
  }
  if (peerLastReadAt && new Date(peerLastReadAt) >= new Date(messageCreatedAt)) {
    return 'read';
  }
  return 'delivered';
}

router.get('/unread-count', async (req, res) => {
  try {
    await ensureUserMessaging(req.userId);
    const count = await countUnreadMessages(req.userId);
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/conversations', async (req, res) => {
  try {
    await ensureUserMessaging(req.userId);
    const convs = await Conversation.find({ ownerUserId: req.userId })
      .sort({ lastMessageAt: -1 })
      .lean();

    const seenSystem = new Set();
    const dedupedConvs = convs.filter((c) => {
      if (c.kind !== 'system_mnoonx' && c.kind !== 'system_support') return true;
      if (seenSystem.has(c.kind)) return false;
      seenSystem.add(c.kind);
      return true;
    });

    const peerIds = convs.filter((c) => c.peerUserId).map((c) => c.peerUserId);
    const peers = await User.find({ _id: { $in: peerIds } })
      .select('username fullName avatar')
      .lean();
    const peerMap = new Map(peers.map((p) => [p._id.toString(), p]));

    const list = await Promise.all(
      dedupedConvs.map(async (c) => {
        const peer = c.peerUserId ? peerMap.get(c.peerUserId.toString()) : null;
        const unreadCount = await unreadCountForConversation(c, req.userId);

        let senderType = c.lastMessageSenderType;
        let senderUserId = c.lastMessageSenderUserId;
        if (c.lastMessageText && !senderType) {
          const lastMsg = await DirectMessage.findOne({ conversationId: c._id })
            .sort({ createdAt: -1 })
            .select('senderType senderUserId')
            .lean();
          if (lastMsg) {
            senderType = lastMsg.senderType;
            senderUserId = lastMsg.senderUserId;
          }
        }

        const lastMessageFromMe =
          senderType === 'user' &&
          senderUserId?.toString() === req.userId.toString();

        let lastMessageStatus = null;
        if (lastMessageFromMe && c.lastMessageAt) {
          if (c.kind === 'dm' && c.peerUserId) {
            const peerLastReadAt = await getPeerLastReadAt(req.userId, c.peerUserId);
            lastMessageStatus = resolveOutboundMessageStatus(
              c,
              peerLastReadAt,
              c.lastMessageAt
            );
          } else {
            lastMessageStatus = 'delivered';
          }
        }

        return {
          id: c._id.toString(),
          kind: c.kind,
          name:
            c.kind === 'dm'
              ? peer?.fullName || peer?.username || 'User'
              : displayNameForKind(c.kind),
          username: peer?.username || null,
          avatar: avatarForKind(c.kind, peer),
          lastMessage: c.lastMessageText,
          lastMessageTime: c.lastMessageAt,
          unreadCount,
          lastMessageFromMe,
          lastMessageStatus,
          isReadOnly: c.kind === 'system_mnoonx',
          isOnline: c.kind !== 'dm',
          officialChannel: c.kind === 'system_mnoonx',
        };
      })
    );

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/conversations/:id', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      ownerUserId: req.userId,
    }).lean();
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const messages = await DirectMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .lean();

    let peer = null;
    if (conv.peerUserId) {
      peer = await User.findById(conv.peerUserId).select('username fullName avatar').lean();
    }

    const peerLastReadAt =
      conv.kind === 'dm' && conv.peerUserId
        ? await getPeerLastReadAt(req.userId, conv.peerUserId)
        : null;

    res.json({
      conversation: {
        id: conv._id.toString(),
        kind: conv.kind,
        name:
          conv.kind === 'dm'
            ? peer?.fullName || peer?.username || 'User'
            : displayNameForKind(conv.kind),
        username: peer?.username || null,
        avatar: avatarForKind(conv.kind, peer),
        isReadOnly: conv.kind === 'system_mnoonx',
        isOnline: conv.kind !== 'dm',
        officialChannel: conv.kind === 'system_mnoonx',
      },
      messages: messages.map((m) => {
        const sender =
          m.senderType === 'system'
            ? conv.kind === 'system_mnoonx'
              ? 'mnoonx'
              : 'support'
            : m.senderUserId?.toString() === req.userId.toString()
              ? 'user'
              : 'peer';

        const status =
          sender === 'user'
            ? resolveOutboundMessageStatus(conv, peerLastReadAt, m.createdAt)
            : 'read';

        return {
          id: m._id.toString(),
          text: m.body,
          sender,
          timestamp: m.createdAt,
          status,
        };
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/conversations/:id/read', async (req, res) => {
  try {
    const conv = await Conversation.findOne({
      _id: req.params.id,
      ownerUserId: req.userId,
    });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    const latestIncoming = await DirectMessage.findOne({
      conversationId: conv._id,
      ...(conv.kind === 'dm'
        ? { senderType: 'user', senderUserId: conv.peerUserId }
        : { senderType: 'system' }),
    })
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();

    const lastReadAt = latestIncoming?.createdAt
      ? new Date(Math.max(Date.now(), new Date(latestIncoming.createdAt).getTime()))
      : new Date();

    await ConversationReadState.findOneAndUpdate(
      { conversationId: conv._id, userId: req.userId },
      { $set: { lastReadAt } },
      { upsert: true, new: true }
    );

    const unreadCount = await unreadCountForConversation(conv, req.userId);
    res.json({ unreadCount, lastReadAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const { body } = req.body;
    if (!body || !String(body).trim()) {
      return res.status(400).json({ message: 'Message body is required' });
    }

    const conv = await Conversation.findOne({
      _id: req.params.id,
      ownerUserId: req.userId,
    });
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });
    if (conv.kind === 'system_mnoonx') {
      return res.status(403).json({ message: 'This channel is read-only' });
    }

    const text = String(body).trim();
    const msg = await DirectMessage.create({
      conversationId: conv._id,
      senderType: 'user',
      senderUserId: req.userId,
      body: text,
    });

    conv.lastMessageText = text.slice(0, 200);
    conv.lastMessageAt = msg.createdAt;
    conv.lastMessageSenderType = 'user';
    conv.lastMessageSenderUserId = req.userId;
    await conv.save();

    if (conv.kind === 'dm' && conv.peerUserId) {
      const peerConv = await Conversation.findOne({
        ownerUserId: conv.peerUserId,
        kind: 'dm',
        peerUserId: req.userId,
      });
      if (peerConv) {
        await DirectMessage.create({
          conversationId: peerConv._id,
          senderType: 'user',
          senderUserId: req.userId,
          body: text,
        });
        peerConv.lastMessageText = text.slice(0, 200);
        peerConv.lastMessageAt = msg.createdAt;
        peerConv.lastMessageSenderType = 'user';
        peerConv.lastMessageSenderUserId = req.userId;
        await peerConv.save();
      }
    }

    await ConversationReadState.findOneAndUpdate(
      { conversationId: conv._id, userId: req.userId },
      { $set: { lastReadAt: msg.createdAt } },
      { upsert: true }
    );

    let outboundStatus = 'delivered';
    if (conv.kind === 'dm' && conv.peerUserId) {
      const peerLastReadAt = await getPeerLastReadAt(req.userId, conv.peerUserId);
      outboundStatus = resolveOutboundMessageStatus(conv, peerLastReadAt, msg.createdAt);
    }

    if (conv.kind === 'system_support') {
      setTimeout(async () => {
        try {
          const reply =
            'Thanks for your message! Our support team will get back to you shortly. Typical response time is under 2 hours.';
          const auto = await DirectMessage.create({
            conversationId: conv._id,
            senderType: 'system',
            body: reply,
          });
          conv.lastMessageText = reply.slice(0, 200);
          conv.lastMessageAt = auto.createdAt;
          conv.lastMessageSenderType = 'system';
          conv.lastMessageSenderUserId = null;
          await conv.save();
        } catch (e) {
          console.error('Support auto-reply error:', e);
        }
      }, 800);
    }

    res.status(201).json({
      id: msg._id.toString(),
      text: msg.body,
      sender: 'user',
      timestamp: msg.createdAt,
      status: outboundStatus,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/dm/:username', async (req, res) => {
  try {
    const peer = await User.findOne({ username: req.params.username.toLowerCase() });
    if (!peer) return res.status(404).json({ message: 'User not found' });
    if (peer._id.toString() === req.userId.toString()) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    const { convA } = await getOrCreateDmConversation(req.userId, peer._id);
    res.json({
      conversationId: convA._id.toString(),
      username: peer.username,
      name: peer.fullName || peer.username,
      avatar: avatarForKind('dm', peer),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
