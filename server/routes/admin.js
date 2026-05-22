const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
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
      Post.countDocuments(),
      DirectMessage.countDocuments(),
      Notification.countDocuments(),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastSeen: { $gte: sevenDaysAgo } }),
      Conversation.countDocuments({
        kind: 'system_support',
        lastMessageSenderType: 'user',
      }),
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

module.exports = router;
