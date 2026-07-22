// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const UserSession = require('../models/UserSession');
const auth = require('../middleware/auth');
const { generateSecret, verifyTotp, otpauthUrl } = require('../services/totp');
const { sendPasswordResetEmail } = require('../services/email');
const {
  CODE_TTL_MS,
  normalizeEmail,
  emailQuery,
  generateResetCode,
  hashResetCode,
  canSendReset,
  isResetCodeValid,
  clearResetFields,
} = require('../services/passwordReset');

const JWT_SECRET = process.env.JWT_SECRET;

function userPayload(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    avatar: user.avatar,
    followersCount: user.followersCount,
    followingCount: user.followingCount,
    postsCount: user.postsCount,
    createdAt: user.createdAt,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
  };
}

async function issueSessionToken(user, req) {
  const tokenId = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { userId: user._id.toString(), sid: tokenId },
    JWT_SECRET,
    { expiresIn: '7d' },
  );
  await UserSession.create({
    userId: user._id.toString(),
    tokenId,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 300),
    ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').slice(0, 64),
    lastActiveAt: new Date(),
  });
  return token;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email ? 'Email already exists' : 'Username already taken',
      });
    }

    const user = new User({
      username,
      email: String(email).trim().toLowerCase(),
      password,
      fullName: fullName || username,
    });

    await user.save();

    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing' });
    }

    const token = await issueSessionToken(user, req);

    res.status(201).json({
      token,
      user: userPayload(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, totpCode, tempToken } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ message: 'Server misconfiguration: JWT_SECRET missing' });
    }

    // Second step: verify TOTP with temp token
    if (tempToken) {
      let payload;
      try {
        payload = jwt.verify(tempToken, JWT_SECRET);
      } catch {
        return res.status(400).json({ message: 'Invalid or expired 2FA session' });
      }
      if (payload.purpose !== '2fa') {
        return res.status(400).json({ message: 'Invalid 2FA session' });
      }
      const user = await User.findById(payload.userId).select('+twoFactorSecret');
      if (!user || user.isBanned) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
      if (!verifyTotp(user.twoFactorSecret, totpCode)) {
        return res.status(400).json({ message: 'Invalid authenticator code' });
      }
      const token = await issueSessionToken(user, req);
      return res.json({ token, user: userPayload(user) });
    }

    const user = await User.findOne(emailQuery(email)).select('+twoFactorSecret');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const pending = jwt.sign(
        { userId: user._id.toString(), purpose: '2fa' },
        JWT_SECRET,
        { expiresIn: '5m' },
      );
      return res.json({
        requires2fa: true,
        tempToken: pending,
        message: 'Enter authenticator code',
      });
    }

    const token = await issueSessionToken(user, req);
    res.json({
      token,
      user: userPayload(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await User.findById(req.userId).select('-password');
    if (!user || user.isBanned) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (req.tokenSid) {
      await UserSession.updateOne(
        { userId: String(req.userId), tokenId: req.tokenSid, revokedAt: null },
        { $set: { lastActiveAt: new Date() } },
      );
    }
    res.json({ user: userPayload(user) });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- 2FA setup ---
router.post('/2fa/setup', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const secret = generateSecret();
    user.twoFactorPendingSecret = secret;
    await user.save();
    const otpauth = otpauthUrl(secret, user.email || user.username, 'MNOONX');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
    res.json({ secret, otpauthUrl: otpauth, qrUrl });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/2fa/enable', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { code } = req.body || {};
    const user = await User.findById(req.userId).select('+twoFactorPendingSecret +twoFactorSecret');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.twoFactorPendingSecret) {
      return res.status(400).json({ message: 'Call /2fa/setup first' });
    }
    if (!verifyTotp(user.twoFactorPendingSecret, code)) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }
    user.twoFactorSecret = user.twoFactorPendingSecret;
    user.twoFactorPendingSecret = '';
    user.twoFactorEnabled = true;
    await user.save();
    res.json({ ok: true, twoFactorEnabled: true });
  } catch (error) {
    console.error('2FA enable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/2fa/disable', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { code, password } = req.body || {};
    const user = await User.findById(req.userId).select('+twoFactorSecret');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (password) {
      const ok = await user.comparePassword(String(password));
      if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });
    } else if (user.twoFactorEnabled && !verifyTotp(user.twoFactorSecret, code)) {
      return res.status(400).json({ message: 'Invalid authenticator code' });
    }
    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    user.twoFactorPendingSecret = '';
    await user.save();
    res.json({ ok: true, twoFactorEnabled: false });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/sessions', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const sessions = await UserSession.find({
      userId: String(req.userId),
      revokedAt: null,
    })
      .sort({ lastActiveAt: -1 })
      .limit(20)
      .lean();
    res.json({
      sessions: sessions.map((s) => ({
        id: s._id.toString(),
        tokenId: s.tokenId,
        userAgent: s.userAgent,
        ip: s.ip,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        current: Boolean(req.tokenSid && req.tokenSid === s.tokenId),
      })),
    });
  } catch (error) {
    console.error('Sessions list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const session = await UserSession.findOne({
      _id: req.params.id,
      userId: String(req.userId),
    });
    if (!session) return res.status(404).json({ message: 'Not found' });
    session.revokedAt = new Date();
    await session.save();
    res.json({ ok: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const RESET_OK_MESSAGE =
  'If an account exists for this email, a reset code has been sent.';

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const locale = String(req.body?.locale || 'en').slice(0, 2);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const query = emailQuery(email);
    if (!query) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    const user = await User.findOne(query).select(
      '+passwordResetHash +passwordResetExpiresAt +passwordResetLastSentAt',
    );

    if (user && !user.isBanned && canSendReset(user.passwordResetLastSentAt)) {
      const code = generateResetCode();
      user.passwordResetHash = hashResetCode(email, code);
      user.passwordResetExpiresAt = new Date(Date.now() + CODE_TTL_MS);
      user.passwordResetLastSentAt = new Date();
      await user.save();

      const sendResult = await sendPasswordResetEmail({ to: normalizeEmail(email), code, locale });
      if (!sendResult.ok) {
        console.error('[password-reset] Failed to send email to', normalizeEmail(email));
      }
    } else if (!user) {
      console.log('[password-reset] No account for', email);
    }

    res.json({ ok: true, message: RESET_OK_MESSAGE });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/verify-reset-code — validate code before password step
router.post('/verify-reset-code', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();

    if (!email || !code || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Valid email and 6-digit code are required' });
    }

    const query = emailQuery(email);
    if (!query) {
      return res.status(400).json({ message: 'Valid email and 6-digit code are required' });
    }

    const user = await User.findOne(query).select(
      '+passwordResetHash +passwordResetExpiresAt +passwordResetLastSentAt',
    );
    if (!user || user.isBanned) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    let valid = false;
    try {
      valid = isResetCodeValid(user, email, code);
    } catch {
      valid = false;
    }
    if (!valid) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const code = String(req.body?.code || '').trim();
    const newPassword = String(req.body?.newPassword || '');

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const query = emailQuery(email);
    if (!query) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    const user = await User.findOne(query).select(
      '+passwordResetHash +passwordResetExpiresAt +passwordResetLastSentAt',
    );
    if (!user || user.isBanned) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    let valid = false;
    try {
      valid = isResetCodeValid(user, email, code);
    } catch {
      valid = false;
    }
    if (!valid) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    clearResetFields(user);
    await user.save();

    res.json({ ok: true, message: 'Password updated. You can sign in now.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
