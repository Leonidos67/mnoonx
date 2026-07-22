const Notification = require('../models/Notification');
const User = require('../models/User');
const { notifyUserDevices } = require('../routes/push');

const DEFAULT_PREFS = {
  pushEnabled: false,
  newFollower: true,
  popupNotifications: true,
};

/**
 * Create in-app notification and optionally send Web Push.
 */
async function dispatchNotification({
  userId,
  type,
  title,
  body,
  actorUserId = null,
  meta = {},
  pushUrl = '/notifications',
  prefKey = null,
}) {
  const uid = String(userId);
  const doc = await Notification.create({
    userId: uid,
    type,
    title: String(title || '').slice(0, 200),
    body: String(body || '').slice(0, 500),
    actorUserId: actorUserId ? String(actorUserId) : null,
    meta,
    read: false,
  });

  const user = await User.findById(uid).select('notificationPreferences').lean();
  const prefs = { ...DEFAULT_PREFS, ...(user?.notificationPreferences || {}) };

  const typeAllowed =
    !prefKey ||
    prefs[prefKey] !== false;

  if (prefs.pushEnabled && typeAllowed) {
    void notifyUserDevices(uid, {
      title: title || 'MNOONX',
      body: body || '',
      url: pushUrl,
      tag: `notif-${doc._id}`,
    });
  }

  return doc;
}

module.exports = { dispatchNotification };
