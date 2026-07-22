/**
 * Lightweight Web Push helper.
 * Uses `web-push` when installed; otherwise logs + no-ops so the app still boots.
 */
let webpush = null;
try {
  // eslint-disable-next-line global-require, import/no-unresolved
  webpush = require('web-push');
} catch {
  webpush = null;
}

const crypto = require('crypto');

function ensureVapidKeys() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || 'mailto:support@mnoonx.local';

  if (publicKey && privateKey) {
    return { publicKey, privateKey, subject, generated: false };
  }

  // Dev fallback: generate ephemeral keys (clients must re-subscribe after restart)
  if (!global.__mnoonxEphemeralVapid) {
    if (webpush) {
      global.__mnoonxEphemeralVapid = webpush.generateVAPIDKeys();
      console.warn(
        '[push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing — using ephemeral keys for this process',
      );
    } else {
      global.__mnoonxEphemeralVapid = { publicKey: '', privateKey: '' };
      console.warn('[push] web-push package not installed and no VAPID keys set');
    }
  }
  return {
    publicKey: global.__mnoonxEphemeralVapid.publicKey,
    privateKey: global.__mnoonxEphemeralVapid.privateKey,
    subject,
    generated: true,
  };
}

function getVapidPublicKey() {
  return ensureVapidKeys().publicKey;
}

function configureWebPush() {
  if (!webpush) return false;
  const { publicKey, privateKey, subject } = ensureVapidKeys();
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * @param {{ endpoint: string, keys: { p256dh: string, auth: string } }} subscription
 * @param {{ title: string, body?: string, url?: string, tag?: string }} payload
 */
async function sendPushNotification(subscription, payload) {
  if (!configureWebPush()) {
    return { ok: false, reason: 'web_push_unavailable' };
  }
  const body = JSON.stringify({
    title: payload.title || 'MNOONX',
    body: payload.body || '',
    url: payload.url || '/',
    tag: payload.tag || 'mnoonx',
  });
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      body,
    );
    return { ok: true };
  } catch (err) {
    const statusCode = err?.statusCode || err?.status;
    return { ok: false, reason: 'send_failed', statusCode, error: err };
  }
}

function urlBase64ToBuffer(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

module.exports = {
  getVapidPublicKey,
  sendPushNotification,
  ensureVapidKeys,
  urlBase64ToBuffer,
  isWebPushAvailable: () => Boolean(webpush),
  randomId: () => crypto.randomBytes(16).toString('hex'),
};
