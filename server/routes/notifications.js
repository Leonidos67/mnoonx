const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { ensureUserMessaging } = require('../services/messaging');

function requestLocale(req) {
  const raw = req.query.locale || req.headers['accept-language'] || 'en';
  const s = String(raw).toLowerCase();
  return s.startsWith('ru') ? 'ru' : 'en';
}

router.use(auth);
router.use((req, res, next) => {
  if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
  next();
});

router.get('/unread-count', async (req, res) => {
  try {
    await ensureUserMessaging(req.userId, requestLocale(req));
    const [mentions, engagement, all] = await Promise.all([
      Notification.countDocuments({
        userId: req.userId,
        read: false,
        type: 'mention',
      }),
      Notification.countDocuments({
        userId: req.userId,
        read: false,
        type: 'engagement',
      }),
      Notification.countDocuments({
        userId: req.userId,
        read: false,
      }),
    ]);
    res.json({ mentions, engagement, all });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    await ensureUserMessaging(req.userId, requestLocale(req));
    const tab = String(req.query.tab || 'all');
    const filter = { userId: req.userId };
    if (tab === 'mentions') filter.type = 'mention';
    else if (tab === 'engagement') filter.type = 'engagement';

    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const actorIds = [...new Set(items.map((n) => n.actorUserId).filter(Boolean))];
    const actors = await User.find({ _id: { $in: actorIds } })
      .select('username fullName avatar')
      .lean();
    const actorMap = new Map(actors.map((a) => [a._id.toString(), a]));

    const enriched = items.map((n) => ({
      ...n,
      actor: n.actorUserId ? actorMap.get(n.actorUserId.toString()) || null : null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/read-all', async (req, res) => {
  try {
    const filter = { userId: req.userId, read: false };
    const tab = String(req.query.tab || '');
    if (tab === 'mentions') filter.type = 'mention';
    else if (tab === 'engagement') filter.type = 'engagement';
    await Notification.updateMany(filter, { $set: { read: true } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ message: 'Not found' });
    res.json(n);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
