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
 * If dedupeKey is set and a row already exists for this user, refresh it instead of inserting.
 */
async function dispatchNotification({
  userId,
  type,
  title,
  body,
  actorUserId = null,
  kind = null,
  link = '',
  pushUrl = '/notifications',
  prefKey = null,
  dedupeKey = null,
}) {
  const uid = String(userId);
  const href = String(link || pushUrl || '').slice(0, 500);
  const titleStr = String(title || '').slice(0, 200);
  const bodyStr = String(body || '').slice(0, 500);
  const actor = actorUserId ? String(actorUserId) : null;
  const key = dedupeKey ? String(dedupeKey).slice(0, 200) : null;

  let doc = null;

  if (key) {
    // Drop legacy rows for the same engagement (created before dedupeKey existed).
    if (kind && actor && href) {
      await Notification.deleteMany({
        userId: uid,
        type,
        kind,
        actorUserId: actor,
        link: href,
        $or: [{ dedupeKey: null }, { dedupeKey: { $exists: false } }, { dedupeKey: '' }],
      });
    }

    doc = await Notification.findOneAndUpdate(
      { userId: uid, dedupeKey: key },
      {
        $set: {
          type,
          ...(kind ? { kind } : {}),
          title: titleStr,
          body: bodyStr,
          actorUserId: actor,
          link: href,
          read: false,
          createdAt: new Date(),
        },
        $setOnInsert: {
          userId: uid,
          dedupeKey: key,
        },
      },
      { upsert: true, new: true }
    );
  } else {
    doc = await Notification.create({
      userId: uid,
      type,
      ...(kind ? { kind } : {}),
      title: titleStr,
      body: bodyStr,
      actorUserId: actor,
      link: href,
      read: false,
    });
  }

  const user = await User.findById(uid).select('notificationPreferences').lean();
  const prefs = { ...DEFAULT_PREFS, ...(user?.notificationPreferences || {}) };

  const typeAllowed = !prefKey || prefs[prefKey] !== false;

  if (prefs.pushEnabled && typeAllowed) {
    void notifyUserDevices(uid, {
      title: title || 'MNOONX',
      body: body || '',
      url: href || '/notifications',
      tag: `notif-${doc._id}`,
    });
  }

  return doc;
}

module.exports = { dispatchNotification };
