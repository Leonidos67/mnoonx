const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');
const DirectMessage = require('../models/DirectMessage');
const Notification = require('../models/Notification');
const Conversation = require('../models/Conversation');

const COLLECTION_MODELS = [
  { name: 'users', model: User },
  { name: 'posts', model: Post },
  { name: 'communities', model: Community },
  { name: 'directmessages', model: DirectMessage },
  { name: 'notifications', model: Notification },
  { name: 'conversations', model: Conversation },
];

async function getCollectionCounts() {
  const rows = await Promise.all(
    COLLECTION_MODELS.map(async ({ name, model }) => ({
      name,
      count: await model.countDocuments(),
    })),
  );
  return rows;
}

async function fetchRecentEvents(limit = 50) {
  const perType = Math.max(8, Math.ceil(limit / 4));

  const [users, posts, communities, messages] = await Promise.all([
    User.find()
      .select('username fullName email createdAt')
      .sort({ createdAt: -1 })
      .limit(perType)
      .lean(),
    Post.find()
      .select('content author community createdAt')
      .sort({ createdAt: -1 })
      .limit(perType)
      .lean(),
    Community.find()
      .select('name handle createdAt')
      .sort({ createdAt: -1 })
      .limit(perType)
      .lean(),
    DirectMessage.find()
      .select('body senderType createdAt')
      .sort({ createdAt: -1 })
      .limit(perType)
      .lean(),
  ]);

  const events = [];

  for (const u of users) {
    events.push({
      id: `user-${u._id}`,
      type: 'user',
      action: 'registered',
      title: u.fullName?.trim() || u.username,
      subtitle: `@${u.username} · ${u.email || '—'}`,
      at: u.createdAt,
    });
  }

  for (const p of posts) {
    const preview = String(p.content || '').trim().slice(0, 80);
    events.push({
      id: `post-${p._id}`,
      type: 'post',
      action: 'created',
      title: preview || 'Новый пост',
      subtitle: p.community ? `Сообщество ${String(p.community)}` : `Автор ${p.author || '—'}`,
      at: p.createdAt,
    });
  }

  for (const c of communities) {
    events.push({
      id: `community-${c._id}`,
      type: 'community',
      action: 'created',
      title: c.name || c.handle,
      subtitle: `/${c.handle}`,
      at: c.createdAt,
    });
  }

  for (const m of messages) {
    const preview = String(m.body || '').trim().slice(0, 80);
    events.push({
      id: `message-${m._id}`,
      type: 'message',
      action: 'sent',
      title: preview || 'Сообщение',
      subtitle: m.senderType === 'user' ? 'Пользователь' : 'Система',
      at: m.createdAt,
    });
  }

  events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return events.slice(0, limit);
}

function getDatabaseInfo() {
  const conn = mongoose.connection;
  return {
    name: conn.name || '—',
    host: conn.host || '—',
    port: conn.port || null,
    readyState: conn.readyState,
  };
}

function getMemoryInfo() {
  const mem = process.memoryUsage();
  return {
    rssMb: Math.round(mem.rss / 1024 / 1024),
    heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
  };
}

module.exports = {
  getCollectionCounts,
  fetchRecentEvents,
  getDatabaseInfo,
  getMemoryInfo,
};
