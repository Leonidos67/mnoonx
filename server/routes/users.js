// routes/users.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { serializeFeedPost } = require('../services/postSerialize');
const {
  normalizeSocialLinks,
  serializeSocialLinks,
  profilePayload,
} = require('../services/socialLinks');
const { loadBlockedSets } = require('../services/userBlocks');

async function serializePostWithAuthor(post, viewerUserId) {
  return serializeFeedPost(post, viewerUserId);
}

// GET /api/users/list — directory (must be before /:username)
router.get('/list', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim().toLowerCase();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const filter = {};
    if (q) {
      filter.$or = [
        { username: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
        { fullName: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
      ];
    }
    const users = await User.find(filter)
      .select('username fullName avatar followersCount createdAt')
      .sort({ username: 1 })
      .limit(limit)
      .lean();
    res.json(
      users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        fullName: u.fullName || u.username,
        avatar: u.avatar || '',
        followersCount: u.followersCount || 0,
        isSelf: u._id.toString() === req.userId.toString(),
      }))
    );
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/suggested — who to follow (must be before /:username)
router.get('/suggested', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const viewerId = req.userId.toString();
    const followingRows = await Follow.find({ follower: viewerId }).select('following').lean();
    const exclude = new Set([viewerId]);
    followingRows.forEach((row) => {
      if (row.following) exclude.add(String(row.following));
    });

    const candidates = await User.find()
      .select('username fullName avatar followersCount')
      .sort({ followersCount: -1, createdAt: -1 })
      .limit(40)
      .lean();

    const users = candidates
      .filter((u) => !exclude.has(u._id.toString()))
      .slice(0, 8)
      .map((u) => ({
        _id: u._id.toString(),
        username: u.username,
        fullName: u.fullName || u.username,
        avatar: u.avatar || '',
        followersCount: u.followersCount || 0,
      }));

    res.json({ users });
  } catch (error) {
    console.error('Suggested users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const DEFAULT_NOTIF_PREFS = {
  popupNotifications: true,
  soundEffects: true,
  aiChatMessage: true,
  aiChatQuestion: true,
  bountyClaimed: true,
  newFollower: true,
  paymentFailed: true,
  upcomingPaymentReminders: true,
  withdrawalStatusChange: true,
  transferReceived: true,
  waitlistAccepted: true,
  pushEnabled: false,
};

// GET /api/users/me/preferences
router.get('/me/preferences', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.userId).select('notificationPreferences');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      ...DEFAULT_NOTIF_PREFS,
      ...(user.notificationPreferences || {}),
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/preferences
router.patch('/me/preferences', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const incoming = req.body && typeof req.body === 'object' ? req.body : {};
    const next = { ...DEFAULT_NOTIF_PREFS, ...(user.notificationPreferences || {}) };
    for (const key of Object.keys(DEFAULT_NOTIF_PREFS)) {
      if (typeof incoming[key] === 'boolean') next[key] = incoming[key];
    }
    user.notificationPreferences = next;
    user.markModified('notificationPreferences');
    await user.save();
    res.json(next);
  } catch (error) {
    console.error('Patch preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/me/activity
router.get('/me/activity', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.userId).select('activityState');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const state = user.activityState || {};
    res.json({
      balance: state.balance || 0,
      log: Array.isArray(state.log) ? state.log : [],
      claimedRuleIds: Array.isArray(state.claimedRuleIds) ? state.claimedRuleIds : [],
      streak: state.streak || 0,
      lastDailyVisit: state.lastDailyVisit || '',
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/users/me/activity — sync client activity state to server
router.put('/me/activity', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const body = req.body || {};
    const balance = Math.max(0, Math.min(1_000_000, Number(body.balance) || 0));
    const log = Array.isArray(body.log) ? body.log.slice(0, 80) : [];
    const claimedRuleIds = Array.isArray(body.claimedRuleIds)
      ? body.claimedRuleIds.map(String).slice(0, 50)
      : [];
    const streak = Math.max(0, Math.min(3650, Number(body.streak) || 0));
    const lastDailyVisit =
      typeof body.lastDailyVisit === 'string' ? body.lastDailyVisit.slice(0, 32) : '';
    user.activityState = { balance, log, claimedRuleIds, streak, lastDailyVisit };
    user.markModified('activityState');
    await user.save();
    res.json(user.activityState);
  } catch (error) {
    console.error('Put activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

const ALLOWED_PROFILE_NAME_COLORS = new Set([
  '',
  '#7c3aed',
  '#e11d48',
  '#0284c7',
  '#059669',
  '#d97706',
  '#c026d3',
]);

const ALLOWED_PROFILE_BG_MODES = new Set(['none', 'solid', 'gradient']);

const ALLOWED_PROFILE_BG_HEX = new Set([
  '#7c3aed',
  '#0ea5e9',
  '#e11d48',
  '#38bdf8',
  '#fbbf24',
  '#059669',
  '#14b8a6',
  '#4f46e5',
  '#d946ef',
  '#64748b',
]);

const ALLOWED_PROFILE_STATUS_ICONS = new Set([
  '',
  'status-metallic-star',
  'status-gloss-a',
  'status-gloss-b',
  'status-gloss-c',
  'status-gloss-d',
  'status-gloss-e',
  'status-gloss-f',
  'status-filled-star',
  'status-eyes',
  'status-particles',
  'status-bomb',
  'status-alien',
  'status-sparkle',
  // legacy ids
  'status-star',
]);

const ALLOWED_PROFILE_BG_EMOJIS = new Set([
  '✨',
  '🔥',
  '💜',
  '🌸',
  '⭐',
  '🎉',
  '💖',
  '🦋',
  '🌙',
  '☀️',
  '👋',
  '🫶',
  '💫',
  '🌟',
  '🎀',
  '🍀',
  '💎',
  '🌈',
  '⚡',
  '🎵',
  '🌺',
  '🍭',
  '👑',
  '🪩',
  '🧸',
  '🐾',
]);

// GET /api/users/me/profile — editable profile fields for settings
router.get('/me/profile', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(profilePayload(user));
  } catch (error) {
    console.error('Get my profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/profile — bio, links, location, etc.
router.patch('/me/profile', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { fullName, bio, location, website, socialLinks, username } = req.body || {};

    if (fullName !== undefined) {
      user.fullName = typeof fullName === 'string' ? fullName.trim().slice(0, 100) : '';
    }
    if (bio !== undefined) {
      user.bio = typeof bio === 'string' ? bio.trim().slice(0, 500) : '';
    }
    if (location !== undefined) {
      user.location = typeof location === 'string' ? location.trim().slice(0, 100) : '';
    }
    if (website !== undefined) {
      user.website = typeof website === 'string' ? website.trim().slice(0, 200) : '';
    }
    if (socialLinks !== undefined) {
      const normalized = normalizeSocialLinks(socialLinks);
      if (!user.socialLinks) user.socialLinks = {};
      for (const [platform, value] of Object.entries(normalized)) {
        user.socialLinks[platform] = value;
        user.markModified(`socialLinks.${platform}`);
      }
      user.markModified('socialLinks');
    }
    if (username !== undefined) {
      const nextUsername =
        typeof username === 'string' ? username.trim().toLowerCase().replace(/^@/, '') : '';
      if (nextUsername.length < 3 || nextUsername.length > 30) {
        return res.status(400).json({ message: 'Username must be 3–30 characters' });
      }
      if (!/^[a-z0-9_]+$/.test(nextUsername)) {
        return res.status(400).json({ message: 'Username may only contain letters, numbers, and underscores' });
      }
      if (nextUsername !== user.username) {
        const taken = await User.findOne({ username: nextUsername });
        if (taken) {
          return res.status(400).json({ message: 'Username already taken' });
        }
        user.username = nextUsername;
      }
    }

    await user.save();
    res.json(profilePayload(user));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/password — change password
router.patch('/me/password', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const ok = await user.comparePassword(String(currentPassword));
    if (!ok) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = String(newPassword);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/me/profile-customization
router.patch('/me/profile-customization', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { profileStatusIcon, profileNameColor, profileBgEmoji } = req.body || {};

    if (profileStatusIcon !== undefined) {
      const statusId =
        typeof profileStatusIcon === 'string' ? profileStatusIcon.trim().slice(0, 64) : '';
      if (!ALLOWED_PROFILE_STATUS_ICONS.has(statusId)) {
        return res.status(400).json({ message: 'Invalid profile status icon' });
      }
      user.profileStatusIcon = statusId;
    }
    if (profileNameColor !== undefined) {
      const color = typeof profileNameColor === 'string' ? profileNameColor.trim() : '';
      if (!ALLOWED_PROFILE_NAME_COLORS.has(color)) {
        return res.status(400).json({ message: 'Invalid profile name color' });
      }
      user.profileNameColor = color;
    }
    if (profileBgEmoji !== undefined) {
      const emoji = typeof profileBgEmoji === 'string' ? profileBgEmoji.trim() : '';
      if (emoji && !ALLOWED_PROFILE_BG_EMOJIS.has(emoji)) {
        return res.status(400).json({ message: 'Invalid profile background emoji' });
      }
      user.profileBgEmoji = emoji;
    }
    // Profile header fill temporarily disabled — always cleared
    user.profileBgMode = 'none';
    user.profileBgColor = '';
    user.profileBgColor2 = '';

    await user.save();

    res.json({
      profileStatusIcon: user.profileStatusIcon || '',
      profileNameColor: user.profileNameColor || '',
      profileBgEmoji: user.profileBgEmoji || '',
      profileBgMode: user.profileBgMode || 'none',
      profileBgColor: user.profileBgColor || '',
      profileBgColor2: user.profileBgColor2 || '',
    });
  } catch (error) {
    console.error('Profile customization error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:username
router.get('/:username', auth, async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('\n=== GET PROFILE ===');
    console.log('Username:', username);
    console.log('req.userId:', req.userId);
    
    const user = await User.findOne({ username })
      .select('-password -email -__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Проверяем подписку и блокировку
    let isFollowing = false;
    let isBlockedByMe = false;
    if (req.userId) {
      const currentUserId = req.userId.toString();
      const profileUserId = user._id.toString();
      
      const follow = await Follow.findOne({
        follower: currentUserId,
        following: profileUserId
      });
      
      isFollowing = !!follow;
      
      if (!follow) {
        const allMyFollows = await Follow.find({ follower: currentUserId });
        for (const f of allMyFollows) {
          if (f.following.toString() === profileUserId) {
            isFollowing = true;
            break;
          }
        }
      }

      const { myBlocked } = await loadBlockedSets(req.userId, user._id);
      isBlockedByMe = myBlocked.has(profileUserId);
    }

    console.log('FINAL isFollowing:', isFollowing);

    const posts = await Post.find({ author: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50);

    const postsWithAuthor = await Promise.all(
      posts.map((post) => serializePostWithAuthor(post, req.userId))
    );

    const json = user.toJSON();
    res.json({
      ...json,
      socialLinks: serializeSocialLinks(user.socialLinks),
      isFollowing,
      isBlockedByMe,
      posts: postsWithAuthor,
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/:username/reposts — posts this user has reposted
router.get('/:username/reposts', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id username');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileUserId = user._id.toString();
    const idVariants = [profileUserId];
    if (mongoose.Types.ObjectId.isValid(profileUserId)) {
      idVariants.push(new mongoose.Types.ObjectId(profileUserId));
    }

    const posts = await Post.find({
      reposts: { $in: idVariants },
      isPrivate: { $ne: true },
    })
      .sort({ updatedAt: -1 })
      .limit(50);

    const postsWithAuthor = await Promise.all(
      posts.map((post) => serializePostWithAuthor(post, req.userId))
    );

    res.json({ posts: postsWithAuthor, total: postsWithAuthor.length });
  } catch (error) {
    console.error('Get reposts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function profileIdVariants(profileUserId) {
  const idVariants = [String(profileUserId)];
  if (mongoose.Types.ObjectId.isValid(profileUserId)) {
    idVariants.push(new mongoose.Types.ObjectId(profileUserId));
  }
  return idVariants;
}

function commentUserMatches(commentUser, idVariants) {
  const uid = String(commentUser);
  return idVariants.some((v) => String(v) === uid);
}

// GET /api/users/:username/replies — comments this user left on posts
router.get('/:username/replies', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id username fullName avatar');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileUserId = user._id.toString();
    const idVariants = profileIdVariants(profileUserId);
    const viewerId = req.userId ? String(req.userId) : null;

    const posts = await Post.find({
      'comments.user': profileUserId,
    })
      .sort({ updatedAt: -1 })
      .limit(120);

    const replyAuthor = {
      _id: profileUserId,
      username: user.username,
      fullName: user.fullName || user.username,
      avatar: user.avatar || '',
    };

    const replies = [];
    for (const post of posts) {
      if (post.isPrivate) {
        const authorId = String(post.author);
        if (viewerId !== authorId && viewerId !== profileUserId) continue;
      }
      const serializedPost = await serializePostWithAuthor(post, req.userId);
      for (const c of post.comments || []) {
        if (!commentUserMatches(c.user, idVariants)) continue;
        replies.push({
          _id: String(c._id),
          content: c.content,
          createdAt: c.createdAt,
          parentId: c.parentId ? String(c.parentId) : null,
          user: replyAuthor,
          post: serializedPost,
        });
      }
    }

    replies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ replies: replies.slice(0, 50), total: Math.min(replies.length, 50) });
  } catch (error) {
    console.error('Get replies error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/users/:username/media — posts by this user that include media
router.get('/:username/media', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username }).select('_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profileUserId = user._id.toString();
    const viewerId = req.userId ? String(req.userId) : null;
    const filter = {
      author: profileUserId,
      'media.0': { $exists: true },
    };
    if (viewerId !== profileUserId) {
      filter.isPrivate = { $ne: true };
    }

    const posts = await Post.find(filter).sort({ createdAt: -1 }).limit(60);
    const postsWithAuthor = await Promise.all(
      posts.map((post) => serializePostWithAuthor(post, req.userId))
    );

    res.json({ posts: postsWithAuthor, total: postsWithAuthor.length });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users/:username/follow
router.post('/:username/follow', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId.toString();
    
    console.log('\n=== FOLLOW ===');
    console.log('Current user ID:', currentUserId);
    
    const userToFollow = await User.findOne({ username });
    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const profileUserId = userToFollow._id.toString();
    console.log('Profile user ID:', profileUserId);

    if (currentUserId === profileUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    // Проверяем существующую подписку
    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: profileUserId
    });

    if (existingFollow) {
      return res.status(400).json({ 
        message: 'Already following this user',
        followersCount: userToFollow.followersCount
      });
    }

    // Создаем подписку со СТРОКОВЫМИ ID
    await Follow.create({
      follower: currentUserId,
      following: profileUserId
    });

    // Обновляем счетчики
    await User.findByIdAndUpdate(currentUserId, {
      $inc: { followingCount: 1 }
    });
    
    await User.findByIdAndUpdate(profileUserId, {
      $inc: { followersCount: 1 }
    });

    // Получаем обновленного пользователя
    const updatedUser = await User.findById(profileUserId)
      .select('followersCount followingCount username');

    console.log('Follow created! New followersCount:', updatedUser.followersCount);

    try {
      const follower = await User.findById(currentUserId).select('username fullName').lean();
      const { dispatchNotification } = require('../services/notificationDispatch');
      await dispatchNotification({
        userId: profileUserId,
        type: 'community',
        title: 'New follower',
        body: `@${follower?.username || 'someone'} started following you`,
        actorUserId: currentUserId,
        pushUrl: follower?.username ? `/@${follower.username}` : '/notifications',
        prefKey: 'newFollower',
      });
    } catch (notifyErr) {
      console.error('Follow notification error:', notifyErr);
    }

    res.json({
      message: 'Successfully followed',
      followersCount: updatedUser.followersCount
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users/:username/unfollow
router.post('/:username/unfollow', auth, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.userId.toString();
    
    const userToUnfollow = await User.findOne({ username });
    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const profileUserId = userToUnfollow._id.toString();

    // Удаляем подписку
    const follow = await Follow.findOneAndDelete({
      follower: currentUserId,
      following: profileUserId
    });

    if (!follow) {
      return res.status(400).json({ 
        message: 'Not following this user',
        followersCount: userToUnfollow.followersCount
      });
    }

    // Обновляем счетчики
    await User.findByIdAndUpdate(currentUserId, {
      $inc: { followingCount: -1 }
    });
    
    await User.findByIdAndUpdate(profileUserId, {
      $inc: { followersCount: -1 }
    });

    const updatedUser = await User.findById(profileUserId)
      .select('followersCount followingCount');

    res.json({
      message: 'Successfully unfollowed',
      followersCount: updatedUser.followersCount
    });
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/users/:username/block
router.post('/:username/block', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ message: 'User not found' });

    const currentUserId = req.userId.toString();
    const targetUserId = target._id.toString();
    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const me = await User.findById(currentUserId);
    if (!me) return res.status(404).json({ message: 'User not found' });

    const blocked = (me.blockedUserIds || []).map((id) => id.toString());
    if (!blocked.includes(targetUserId)) {
      me.blockedUserIds = [...(me.blockedUserIds || []), target._id];
      await me.save();
    }

    await Follow.deleteMany({
      $or: [
        { follower: currentUserId, following: targetUserId },
        { follower: targetUserId, following: currentUserId },
      ],
    });

    res.json({ ok: true, blocked: true });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/:username/unblock
router.post('/:username/unblock', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const target = await User.findOne({ username: req.params.username });
    if (!target) return res.status(404).json({ message: 'User not found' });

    const targetUserId = target._id.toString();
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: 'User not found' });

    me.blockedUserIds = (me.blockedUserIds || []).filter(
      (id) => id.toString() !== targetUserId
    );
    await me.save();

    res.json({ ok: true, blocked: false });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/:username/followers
router.get('/:username/followers', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('Getting followers for:', username);
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ищем подписки где following = этот пользователь
    const follows = await Follow.find({ following: user._id.toString() })
      .sort({ createdAt: -1 });

    // Получаем ID подписчиков
    const followerIds = follows.map(f => f.follower);
    
    console.log('Follower IDs:', followerIds);
    
    // Находим пользователей
    const followers = await User.find({
      _id: { $in: followerIds }
    }).select('username fullName avatar bio followersCount');

    console.log(`Found ${followers.length} followers:`, followers.map(f => f.username));

    // Преобразуем в простые объекты БЕЗ виртуальных полей
    const cleanFollowers = followers.map(f => ({
      _id: f._id,
      username: f.username,
      fullName: f.fullName || f.username,
      avatar: f.avatar || '',
      bio: f.bio || '',
      followersCount: f.followersCount || 0
    }));

    res.json({
      followers: cleanFollowers,
      total: cleanFollowers.length
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/users/:username/following
router.get('/:username/following', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('Getting following for:', username);
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ищем подписки где follower = этот пользователь
    const follows = await Follow.find({ follower: user._id.toString() })
      .sort({ createdAt: -1 });

    // Получаем ID тех на кого подписан
    const followingIds = follows.map(f => f.following);
    
    console.log('Following IDs:', followingIds);
    
    // Находим пользователей
    const following = await User.find({
      _id: { $in: followingIds }
    }).select('username fullName avatar bio followersCount');

    console.log(`Found ${following.length} following:`, following.map(f => f.username));

    // Преобразуем в простые объекты
    const cleanFollowing = following.map(f => ({
      _id: f._id,
      username: f.username,
      fullName: f.fullName || f.username,
      avatar: f.avatar || '',
      bio: f.bio || '',
      followersCount: f.followersCount || 0
    }));

    res.json({
      following: cleanFollowing,
      total: cleanFollowing.length
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;