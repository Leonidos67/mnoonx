const express = require('express');
const auth = require('../middleware/auth');
const PushSubscription = require('../models/PushSubscription');
const { getVapidPublicKey, sendPushNotification, isWebPushAvailable } = require('../services/webPush');

const router = express.Router();

function requireAuth(req, res) {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/vapid-public-key', (_req, res) => {
  const publicKey = getVapidPublicKey();
  res.json({
    publicKey,
    available: Boolean(publicKey) && isWebPushAvailable(),
  });
});

router.post('/subscribe', auth, async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const { endpoint, keys, userAgent } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ message: 'Invalid subscription' });
    }
    const doc = await PushSubscription.findOneAndUpdate(
      { endpoint: String(endpoint) },
      {
        userId: String(req.userId),
        endpoint: String(endpoint),
        keys: {
          p256dh: String(keys.p256dh),
          auth: String(keys.auth),
        },
        userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 300) : '',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json({ ok: true, id: doc._id.toString() });
  } catch (error) {
    console.error('Push subscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/subscribe', auth, async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const endpoint = req.body?.endpoint || req.query?.endpoint;
    if (!endpoint) {
      return res.status(400).json({ message: 'endpoint required' });
    }
    await PushSubscription.deleteOne({
      userId: String(req.userId),
      endpoint: String(endpoint),
    });
    res.json({ ok: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/test', auth, async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const subs = await PushSubscription.find({ userId: String(req.userId) }).lean();
    if (subs.length === 0) {
      return res.status(404).json({ message: 'No push subscriptions' });
    }
    const results = [];
    for (const sub of subs) {
      const result = await sendPushNotification(sub, {
        title: 'MNOONX',
        body: req.body?.body || 'Push notifications are working',
        url: req.body?.url || '/',
        tag: 'push-test',
      });
      if (!result.ok && (result.statusCode === 404 || result.statusCode === 410)) {
        await PushSubscription.deleteOne({ _id: sub._id });
      }
      results.push(result);
    }
    res.json({ ok: results.some((r) => r.ok), results });
  } catch (error) {
    console.error('Push test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

async function notifyUserDevices(userId, payload) {
  try {
    const subs = await PushSubscription.find({ userId: String(userId) }).lean();
    for (const sub of subs) {
      const result = await sendPushNotification(sub, payload);
      if (!result.ok && (result.statusCode === 404 || result.statusCode === 410)) {
        await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
      }
    }
  } catch (err) {
    console.error('notifyUserDevices error:', err);
  }
}

module.exports = router;
module.exports.notifyUserDevices = notifyUserDevices;
