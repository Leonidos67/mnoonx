const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const SupportTicket = require('../models/SupportTicket');
const SupportTicketMessage = require('../models/SupportTicketMessage');
const requireAdmin = require('../middleware/requireAdmin');
const { ensureUserMessaging } = require('../services/messaging');
const {
  buildDailyBuckets,
  incrementBucket,
  toCumulative,
  escapeRegex,
  countryFromLocation,
  userStatusLabel,
} = require('../services/adminAnalytics');
const {
  getCollectionCounts,
  fetchRecentEvents,
  getDatabaseInfo,
  getMemoryInfo,
} = require('../services/adminLogs');

const router = express.Router();

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const serverStartedAt = Date.now();

function mongoStatusLabel() {
  const state = mongoose.connection.readyState;
  if (state === 1) return { code: 'online', label: 'Подключено' };
  if (state === 2) return { code: 'connecting', label: 'Подключение…' };
  if (state === 0) return { code: 'disconnected', label: 'Отключено' };
  return { code: 'error', label: 'Ошибка' };
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (
    String(username || '').trim() !== ADMIN_USERNAME ||
    String(password || '') !== ADMIN_PASSWORD
  ) {
    return res.status(401).json({ message: 'Неверный логин или пароль' });
  }

  const token = jwt.sign({ role: 'admin', username: ADMIN_USERNAME }, ADMIN_JWT_SECRET, {
    expiresIn: '12h',
  });

  res.json({ token, username: ADMIN_USERNAME });
});

router.get('/session', requireAdmin, (req, res) => {
  res.json({ ok: true, username: req.admin.username });
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      usersCount,
      communitiesCount,
      supportThreads,
      supportTicketsOpen,
      postsCount,
      messagesCount,
      notificationsCount,
      newUsers7d,
      newPosts7d,
      activeUsers7d,
      needsReplyCount,
    ] = await Promise.all([
      User.countDocuments(),
      Community.countDocuments(),
      Conversation.countDocuments({ kind: 'system_support' }),
      SupportTicket.countDocuments({ status: 'open' }),
      Post.countDocuments(),
      DirectMessage.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastSeen: { $gte: sevenDaysAgo } }),
      countSupportTicketsNeedingReply(),
    ]);

    const mongo = mongoStatusLabel();
    const uptimeSec = Math.floor((Date.now() - serverStartedAt) / 1000);

    res.json({
      server: {
        status: 'running',
        statusLabel: 'Работает',
        uptimeSec,
        nodeVersion: process.version,
        mongo,
      },
      usersCount,
      communitiesCount,
      supportThreads,
      supportTicketsOpen,
      postsCount,
      messagesCount,
      notificationsCount,
      newUsers7d,
      newPosts7d,
      activeUsers7d,
      needsReplyCount,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const DAYS = 30;
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (DAYS - 1));
    since.setUTCHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userRegistrations = buildDailyBuckets(DAYS);
    const postsActivity = buildDailyBuckets(DAYS);
    const communitiesCreated = buildDailyBuckets(DAYS);
    const messagesActivity = buildDailyBuckets(DAYS);

    const [users, posts, communities, messages] = await Promise.all([
      User.find({ createdAt: { $gte: since } }).select('createdAt').lean(),
      Post.find({ createdAt: { $gte: since } }).select('createdAt').lean(),
      Community.find({ createdAt: { $gte: since } }).select('createdAt').lean(),
      DirectMessage.find({ createdAt: { $gte: since } }).select('createdAt').lean(),
    ]);

    for (const u of users) incrementBucket(userRegistrations, u.createdAt);
    for (const p of posts) incrementBucket(postsActivity, p.createdAt);
    for (const c of communities) incrementBucket(communitiesCreated, c.createdAt);
    for (const m of messages) incrementBucket(messagesActivity, m.createdAt);

    const periodStart = userRegistrations[0]?.date;
    const usersBeforePeriod = periodStart
      ? await User.countDocuments({
          createdAt: { $lt: new Date(`${periodStart}T00:00:00.000Z`) },
        })
      : 0;

    const [
      usersCount,
      communitiesCount,
      postsCount,
      newUsers7d,
      newPosts7d,
      newCommunities7d,
      activeUsers7d,
      needsReplyCount,
      bulkUsersCount,
    ] = await Promise.all([
      User.countDocuments(),
      Community.countDocuments(),
      Post.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Community.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastSeen: { $gte: sevenDaysAgo } }),
      Conversation.countDocuments({
        kind: 'system_support',
        lastMessageSenderType: 'user',
      }),
      User.countDocuments({ email: /@bulk\.seed\.mnoonx\.dev$/i }),
    ]);

    res.json({
      summary: {
        usersCount,
        communitiesCount,
        postsCount,
        newUsers7d,
        newPosts7d,
        newCommunities7d,
        activeUsers7d,
        needsReplyCount,
        bulkUsersCount,
      },
      userRegistrations,
      userRegistrationsCumulative: toCumulative(userRegistrations, usersBeforePeriod),
      postsActivity,
      communitiesCreated,
      messagesActivity,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/users', requireAdmin, async (req, res) => {
  try {
    const page = Math.max(0, parseInt(String(req.query.page || '0'), 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '25'), 10) || 25));
    const search = String(req.query.search || '').trim();
    const sortKey = ['createdAt', 'lastSeen', 'postsCount', 'username'].includes(
      String(req.query.sort || '')
    )
      ? String(req.query.sort)
      : 'createdAt';
    const sortDir = String(req.query.dir || 'desc') === 'asc' ? 1 : -1;

    const filter = {};
    if (search) {
      const rx = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ username: rx }, { email: rx }, { fullName: rx }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select(
          'username fullName email avatar location createdAt lastSeen isOnline postsCount followersCount followingCount ownedCommunities joinedCommunities'
        )
        .sort({ [sortKey]: sortDir })
        .skip(page * limit)
        .limit(limit)
        .lean(),
    ]);

    const rows = users.map((u) => {
      const id = u._id.toString();
      const owned = (u.ownedCommunities || []).length;
      const joined = (u.joinedCommunities || []).length;
      const email = u.email || '';
      return {
        id,
        username: u.username,
        fullName: u.fullName || '',
        email,
        avatar: u.avatar || '',
        status: userStatusLabel(u),
        country: countryFromLocation(u.location),
        location: u.location || '',
        totalSpend: 0,
        joinedAt: u.createdAt,
        lastAccessedAt: u.lastSeen || u.updatedAt || u.createdAt,
        postsCount: u.postsCount || 0,
        followersCount: u.followersCount || 0,
        followingCount: u.followingCount || 0,
        communitiesOwned: owned,
        communitiesJoined: joined,
        isBulkSeed: /@bulk\.seed\.mnoonx\.dev$/i.test(email),
      };
    });

    res.json({ users: rows, total, page, limit });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(10, parseInt(String(req.query.limit || '50'), 10) || 50));
    const [collections, events] = await Promise.all([
      getCollectionCounts(),
      fetchRecentEvents(limit),
    ]);

    res.json({
      database: getDatabaseInfo(),
      memory: getMemoryInfo(),
      collections,
      events,
    });
  } catch (err) {
    console.error('Admin logs error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const TICKET_CATEGORY_LABELS = {
  bug: 'Bug Report',
  authentication: 'Authentication',
  other: 'Other',
};

async function countSupportTicketsNeedingReply() {
  const openTickets = await SupportTicket.find({ status: 'open' }).select('_id').lean();
  if (!openTickets.length) return 0;
  const ids = openTickets.map((t) => t._id);
  const lastByTicket = await SupportTicketMessage.aggregate([
    { $match: { ticketId: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$ticketId',
        senderType: { $first: '$senderType' },
      },
    },
  ]);
  return lastByTicket.filter((row) => row.senderType === 'user').length;
}

async function lastMessagesByTicketIds(ticketIds) {
  if (!ticketIds.length) return new Map();
  const rows = await SupportTicketMessage.aggregate([
    { $match: { ticketId: { $in: ticketIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$ticketId',
        senderType: { $first: '$senderType' },
        body: { $first: '$body' },
        createdAt: { $first: '$createdAt' },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r]));
}

function serializeAdminTicket(doc, user, lastMsg) {
  const id = doc._id.toString();
  const needsReply = doc.status === 'open' && lastMsg?.senderType === 'user';
  return {
    id,
    shortId: id.slice(-8),
    status: doc.status,
    category: doc.category,
    categoryLabel: TICKET_CATEGORY_LABELS[doc.category] || doc.category,
    title: doc.title,
    description: doc.description,
    communityId: doc.communityId ? doc.communityId.toString() : null,
    communityHandle: doc.communityHandle || '',
    communityName: doc.communityName || '',
    appLink: doc.appLink || '',
    attachmentNames: doc.attachmentNames || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    closedAt: doc.closedAt,
    userId: doc.userId.toString(),
    username: user?.username || 'unknown',
    fullName: user?.fullName || user?.username || 'Пользователь',
    email: user?.email || '',
    avatar: user?.avatar || '',
    lastMessageText: (lastMsg?.body || doc.description || '').slice(0, 280),
    lastMessageAt: lastMsg?.createdAt || doc.updatedAt,
    lastMessageSender: lastMsg?.senderType || null,
    needsReply,
  };
}

router.get('/support-tickets', requireAdmin, async (req, res) => {
  try {
    const statusFilter = String(req.query.status || 'all');
    const query = {};
    if (statusFilter === 'open' || statusFilter === 'closed') {
      query.status = statusFilter;
    }

    const tickets = await SupportTicket.find(query).sort({ updatedAt: -1 }).lean();
    const userIds = tickets.map((t) => t.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username fullName email avatar')
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const lastMap = await lastMessagesByTicketIds(tickets.map((t) => t._id));

    let list = tickets.map((t) =>
      serializeAdminTicket(t, userMap.get(t.userId.toString()), lastMap.get(t._id.toString())),
    );

    if (statusFilter === 'needs_reply') {
      list = list.filter((t) => t.needsReply);
    }

    const [openCount, closedCount, needsReplyCount] = await Promise.all([
      SupportTicket.countDocuments({ status: 'open' }),
      SupportTicket.countDocuments({ status: 'closed' }),
      countSupportTicketsNeedingReply(),
    ]);

    res.json({
      tickets: list,
      counts: {
        open: openCount,
        closed: closedCount,
        all: openCount + closedCount,
        needsReply: needsReplyCount,
      },
    });
  } catch (err) {
    console.error('Admin support-tickets list error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/support-tickets/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный id' });
    }

    const ticket = await SupportTicket.findById(req.params.id).lean();
    if (!ticket) return res.status(404).json({ message: 'Тикет не найден' });

    const user = await User.findById(ticket.userId)
      .select('username fullName email avatar createdAt')
      .lean();

    const messages = await SupportTicketMessage.find({ ticketId: ticket._id })
      .sort({ createdAt: 1 })
      .lean();

    const lastMap = await lastMessagesByTicketIds([ticket._id]);

    res.json({
      ticket: serializeAdminTicket(ticket, user, lastMap.get(ticket._id.toString())),
      messages: messages.map((m) => ({
        id: m._id.toString(),
        sender: m.senderType,
        text: m.body,
        timestamp: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin support-ticket detail error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/support-tickets/:id/reply', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный id' });
    }

    const text = String(req.body?.body || '').trim();
    if (!text) return res.status(400).json({ message: 'Текст ответа обязателен' });

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Тикет не найден' });
    if (ticket.status === 'closed') {
      return res.status(400).json({ message: 'Тикет закрыт — сначала откройте его' });
    }

    const msg = await SupportTicketMessage.create({
      ticketId: ticket._id,
      senderType: 'support',
      body: text,
    });

    ticket.updatedAt = msg.createdAt;
    await ticket.save();

    res.status(201).json({
      message: {
        id: msg._id.toString(),
        sender: 'support',
        text: msg.body,
        timestamp: msg.createdAt,
      },
    });
  } catch (err) {
    console.error('Admin support-ticket reply error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.patch('/support-tickets/:id/close', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный id' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Тикет не найден' });

    ticket.status = 'closed';
    ticket.closedAt = new Date();
    ticket.updatedAt = ticket.closedAt;
    await ticket.save();

    const user = await User.findById(ticket.userId)
      .select('username fullName email avatar')
      .lean();
    const lastMap = await lastMessagesByTicketIds([ticket._id]);

    res.json({ ticket: serializeAdminTicket(ticket.toObject(), user, lastMap.get(ticket._id.toString())) });
  } catch (err) {
    console.error('Admin support-ticket close error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.patch('/support-tickets/:id/reopen', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Некорректный id' });
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Тикет не найден' });

    ticket.status = 'open';
    ticket.closedAt = null;
    ticket.updatedAt = new Date();
    await ticket.save();

    const user = await User.findById(ticket.userId)
      .select('username fullName email avatar')
      .lean();
    const lastMap = await lastMessagesByTicketIds([ticket._id]);

    res.json({ ticket: serializeAdminTicket(ticket.toObject(), user, lastMap.get(ticket._id.toString())) });
  } catch (err) {
    console.error('Admin support-ticket reopen error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

/** @deprecated Messenger threads — use /support-tickets for ticket system */
router.get('/support/tickets', requireAdmin, async (req, res) => {
  try {
    const convs = await Conversation.find({ kind: 'system_support' })
      .sort({ lastMessageAt: -1 })
      .lean();

    const ownerIds = convs.map((c) => c.ownerUserId);
    const users = await User.find({ _id: { $in: ownerIds } })
      .select('username fullName avatar email createdAt')
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const tickets = await Promise.all(
      convs.map(async (conv) => {
        const ownerId = conv.ownerUserId.toString();
        const user = userMap.get(ownerId);
        const userMessages = await DirectMessage.countDocuments({
          conversationId: conv._id,
          senderType: 'user',
        });
        const needsReply = conv.lastMessageSenderType === 'user';

        return {
          userId: ownerId,
          conversationId: conv._id.toString(),
          username: user?.username || 'unknown',
          fullName: user?.fullName || user?.username || 'Пользователь',
          avatar: user?.avatar || '',
          email: user?.email || '',
          lastMessageText: conv.lastMessageText || '',
          lastMessageAt: conv.lastMessageAt,
          userMessagesCount: userMessages,
          needsReply,
        };
      }),
    );

    const needsReplyCount = tickets.filter((t) => t.needsReply).length;

    res.json({ tickets, needsReplyCount });
  } catch (err) {
    console.error('Admin support tickets error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.get('/support/tickets/:userId/messages', requireAdmin, async (req, res) => {
  try {
    const ownerId = req.params.userId;
    let conv = await Conversation.findOne({
      ownerUserId: ownerId,
      kind: 'system_support',
    });

    if (!conv) {
      await ensureUserMessaging(ownerId);
      conv = await Conversation.findOne({
        ownerUserId: ownerId,
        kind: 'system_support',
      });
    }
    if (!conv) {
      return res.status(404).json({ message: 'Диалог поддержки не найден' });
    }

    const user = await User.findById(ownerId)
      .select('username fullName avatar email')
      .lean();

    const messages = await DirectMessage.find({ conversationId: conv._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      user: user
        ? {
            _id: user._id.toString(),
            username: user.username,
            fullName: user.fullName || user.username,
            avatar: user.avatar || '',
            email: user.email || '',
          }
        : null,
      conversationId: conv._id.toString(),
      messages: messages.map((m) => ({
        id: m._id.toString(),
        text: m.body,
        sender: m.senderType === 'user' ? 'user' : 'support',
        timestamp: m.createdAt,
      })),
    });
  } catch (err) {
    console.error('Admin support messages error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

router.post('/support/tickets/:userId/reply', requireAdmin, async (req, res) => {
  try {
    const { body } = req.body || {};
    const text = String(body || '').trim();
    if (!text) {
      return res.status(400).json({ message: 'Текст ответа обязателен' });
    }

    const ownerId = req.params.userId;
    let conv = await Conversation.findOne({
      ownerUserId: ownerId,
      kind: 'system_support',
    });

    if (!conv) {
      await ensureUserMessaging(ownerId);
      conv = await Conversation.findOne({
        ownerUserId: ownerId,
        kind: 'system_support',
      });
    }
    if (!conv) {
      return res.status(404).json({ message: 'Диалог поддержки не найден' });
    }

    const msg = await DirectMessage.create({
      conversationId: conv._id,
      senderType: 'system',
      body: text,
    });

    conv.lastMessageText = text.slice(0, 200);
    conv.lastMessageAt = msg.createdAt;
    conv.lastMessageSenderType = 'system';
    conv.lastMessageSenderUserId = null;
    await conv.save();

    res.status(201).json({
      id: msg._id.toString(),
      text: msg.body,
      sender: 'support',
      timestamp: msg.createdAt,
    });
  } catch (err) {
    console.error('Admin support reply error:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

const { listReports, patchReport } = require('./reports');
router.get('/reports', requireAdmin, listReports);
router.patch('/reports/:id', requireAdmin, patchReport);

module.exports = router;
