const crypto = require('crypto');

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

function resetSecret() {
  return process.env.JWT_SECRET || 'dev-reset-secret';
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive email match (DB may have mixed-case legacy rows). */
function emailQuery(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return { email: { $regex: new RegExp(`^${escapeRegex(normalized)}$`, 'i') } };
}

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashResetCode(email, code) {
  return crypto.createHmac('sha256', resetSecret()).update(`${normalizeEmail(email)}:${code}`).digest('hex');
}

function canSendReset(lastSentAt) {
  if (!lastSentAt) return true;
  return Date.now() - new Date(lastSentAt).getTime() >= RESEND_COOLDOWN_MS;
}

function isResetCodeValid(user, email, code) {
  if (!user?.passwordResetHash || !user.passwordResetExpiresAt) return false;
  if (new Date(user.passwordResetExpiresAt).getTime() < Date.now()) return false;
  const expected = hashResetCode(email, String(code).trim());
  if (expected.length !== user.passwordResetHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(user.passwordResetHash));
}

function clearResetFields(user) {
  user.passwordResetHash = '';
  user.passwordResetExpiresAt = null;
  user.passwordResetLastSentAt = null;
}

module.exports = {
  CODE_TTL_MS,
  RESEND_COOLDOWN_MS,
  normalizeEmail,
  emailQuery,
  generateResetCode,
  hashResetCode,
  canSendReset,
  isResetCodeValid,
  clearResetFields,
};
