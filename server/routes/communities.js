// server/routes/communities.js
const express = require('express');
const crypto = require('crypto');
const fs = require('fs').promises;
const fssync = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const router = express.Router();
const Community = require('../models/Community');
const User = require('../models/User');
const CommunityChatMessage = require('../models/CommunityChatMessage');
const CommunityChatReadState = require('../models/CommunityChatReadState');
const CommunityCourse = require('../models/CommunityCourse');
const CommunityContentDocument = require('../models/CommunityContentDocument');
const CommunityFile = require('../models/CommunityFile');
const CommunityAnnouncement = require('../models/CommunityAnnouncement');
const CommunityAnnouncementMeta = require('../models/CommunityAnnouncementMeta');
const CommunityEvent = require('../models/CommunityEvent');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const communityAdmin = require('../utils/communityAdmin');

const ALLOWED_COMMUNITY_APPS = ['chat', 'courses', 'content', 'files', 'announcements', 'events'];

const UPLOADS_ROOT = path.join(__dirname, '../uploads');
const COMMUNITY_FILES_TMP = path.join(UPLOADS_ROOT, 'community-files', '_tmp');
try {
  fssync.mkdirSync(COMMUNITY_FILES_TMP, { recursive: true });
} catch (_) {
  /* ignore */
}
const communityFileUpload = multer({
  dest: COMMUNITY_FILES_TMP,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const COMMUNITY_BRANDING_TMP = path.join(UPLOADS_ROOT, 'community-branding', '_tmp');
try {
  fssync.mkdirSync(COMMUNITY_BRANDING_TMP, { recursive: true });
} catch (_) {
  /* ignore */
}

const communityBrandingUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, COMMUNITY_BRANDING_TMP);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${crypto.randomBytes(12).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (ok.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP or GIF images are allowed'));
  },
});

async function unlinkCommunityFileRelative(relativePath) {
  const abs = path.join(UPLOADS_ROOT, relativePath);
  try {
    await fs.unlink(abs);
  } catch (e) {
    if (e.code !== 'ENOENT') console.error(e);
  }
}

async function deleteAllCommunityFilesForInstance(communityOid, appInstanceId) {
  const list = await CommunityFile.find({ community: communityOid, appInstanceId }).lean();
  for (const f of list) {
    await unlinkCommunityFileRelative(f.relativePath);
  }
  await CommunityFile.deleteMany({ community: communityOid, appInstanceId });
}

async function deleteAnnouncementsForInstance(communityOid, appInstanceId) {
  await CommunityAnnouncement.deleteMany({ community: communityOid, appInstanceId });
  await CommunityAnnouncementMeta.deleteMany({ community: communityOid, appInstanceId });
}

async function deleteEventsForInstance(communityOid, appInstanceId) {
  await CommunityEvent.deleteMany({ community: communityOid, appInstanceId });
}

/** Полное удаление сообщества и связанных данных (посты, приложения, файлы на диске). */
async function deleteCommunityCascade(communityDoc) {
  const cid = communityDoc._id;
  const handle = String(communityDoc.handle || '').toLowerCase();
  const Post = require('../models/Post');

  await CommunityChatMessage.deleteMany({ community: cid });
  await CommunityChatReadState.deleteMany({ community: cid });
  await CommunityCourse.deleteMany({ community: cid });
  await CommunityContentDocument.deleteMany({ community: cid });
  await CommunityAnnouncement.deleteMany({ community: cid });
  await CommunityAnnouncementMeta.deleteMany({ community: cid });
  await CommunityEvent.deleteMany({ community: cid });

  const fileDocs = await CommunityFile.find({ community: cid }).lean();
  for (const f of fileDocs) {
    await unlinkCommunityFileRelative(f.relativePath);
  }
  await CommunityFile.deleteMany({ community: cid });

  const posts = await Post.find({ community: cid }).select('author').lean();
  const countsByAuthor = {};
  for (const p of posts) {
    const a = String(p.author);
    countsByAuthor[a] = (countsByAuthor[a] || 0) + 1;
  }
  await Post.deleteMany({ community: cid });
  for (const [authorId, n] of Object.entries(countsByAuthor)) {
    try {
      await User.findByIdAndUpdate(authorId, { $inc: { postsCount: -n } });
    } catch (e) {
      console.error(e);
    }
  }

  await User.updateMany(
    { $or: [{ joinedCommunities: cid }, { ownedCommunities: cid }] },
    { $pull: { joinedCommunities: cid, ownedCommunities: cid } }
  );

  if (handle) {
    const brandingDir = path.join(UPLOADS_ROOT, 'community-branding', handle);
    try {
      await fs.rm(brandingDir, { recursive: true, force: true });
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(e);
    }
  }

  await Community.deleteOne({ _id: cid });
}

function communityByHandle(handle) {
  return Community.findOne({ handle: String(handle).toLowerCase() });
}

function ownerIdString(community) {
  const o = community?.owner;
  if (!o) return '';
  if (typeof o === 'object' && o._id != null) return o._id.toString();
  return o.toString();
}

function isCommunityMember(community, userId) {
  if (!userId || !community) return false;
  const uid = userId.toString();
  return community.members.some((m) => m.toString() === uid);
}

function isCommunityOwner(community, userId) {
  if (!userId || !community) return false;
  const ownerId = ownerIdString(community);
  if (!ownerId) return false;
  return ownerId === userId.toString();
}

function canViewCommunity(community, userId) {
  if (!community) return false;
  if (community.isPublic !== false) return true;
  return isCommunityOwner(community, userId) || isCommunityMember(community, userId);
}

function canPostInCommunity(community, userId) {
  if (!userId || !community) return false;
  if (isCommunityOwner(community, userId)) return true;
  if (!isCommunityMember(community, userId)) return false;
  return community.membersCanPost !== false;
}

function hasJoinCode(community) {
  return Boolean(community?.joinCode && String(community.joinCode).trim());
}

function verifyJoinCode(community, code) {
  if (!hasJoinCode(community)) return true;
  const expected = String(community.joinCode).trim();
  const given = code != null ? String(code).trim() : '';
  return given.length > 0 && given.toLowerCase() === expected.toLowerCase();
}

function getMemberJoinedAt(community, userId) {
  const uid = String(userId);
  const entry = (community.memberJoins || []).find((j) => j.userId && j.userId.toString() === uid);
  if (entry?.joinedAt) return entry.joinedAt;
  return community.createdAt || new Date();
}

async function ensureMemberJoins(community) {
  if (!community.memberJoins) community.memberJoins = [];
  const known = new Set(community.memberJoins.map((j) => j.userId.toString()));
  let dirty = false;
  const ownerId = ownerIdString(community);
  const ids = new Set(community.members.map((m) => m.toString()));
  if (ownerId) ids.add(ownerId);
  const fallback = community.createdAt || new Date();
  for (const uid of ids) {
    if (!known.has(uid)) {
      community.memberJoins.push({ userId: uid, joinedAt: fallback });
      dirty = true;
    }
  }
  if (dirty) {
    community.markModified('memberJoins');
    await community.save();
  }
}

function recordMemberJoin(community, userId, joinedAt = new Date()) {
  if (!community.memberJoins) community.memberJoins = [];
  const uid = String(userId);
  const exists = community.memberJoins.some((j) => j.userId && j.userId.toString() === uid);
  if (!exists) {
    community.memberJoins.push({ userId, joinedAt });
  }
}

function buildDailyBuckets(days) {
  const buckets = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return buckets;
}

function incrementBucket(buckets, isoDate) {
  if (!isoDate) return;
  const key = new Date(isoDate).toISOString().slice(0, 10);
  const row = buckets.find((b) => b.date === key);
  if (row) row.count += 1;
}

function syncInstalledAppsFromInstances(community) {
  const instances = community.installedAppInstances || [];
  community.installedApps = [...new Set(instances.map((i) => i.appId))];
}

async function migrateLegacyInstances(community) {
  const hasChat = (community.installedApps || []).includes('chat');
  const inst = community.installedAppInstances || [];
  if (hasChat && inst.length === 0) {
    community.installedAppInstances = [
      {
        id: 'default',
        appId: 'chat',
        title: 'Chat',
        visibleToMembers: community.chatPublic !== false,
        note: '',
      },
    ];
    syncInstalledAppsFromInstances(community);
    await CommunityChatMessage.updateMany(
      {
        community: community._id,
        $or: [{ chatInstanceId: { $exists: false } }, { chatInstanceId: null }, { chatInstanceId: '' }],
      },
      { $set: { chatInstanceId: 'default' } }
    );
    community.markModified('installedAppInstances');
    await community.save();
  }
}

function filterInstancesForViewer(community, userId) {
  const instances = community.installedAppInstances || [];
  if (
    userId &&
    (ownerIdString(community) === userId.toString() ||
      communityAdmin.hasAdminPermission(community, userId, 'canManageApps'))
  ) {
    return instances;
  }
  return instances.filter((i) => i.visibleToMembers);
}

async function loadCommunityWithAdmins(handle) {
  return Community.findOne({ handle: handle.toLowerCase() })
    .populate('owner', 'username fullName avatar')
    .populate('admins.user', 'username fullName avatar');
}

function serializeCommunityDoc(community, userId) {
  const obj = community.toObject();
  const visible = filterInstancesForViewer(community, userId);
  obj.installedAppInstances = visible;
  obj.installedApps = [...new Set(visible.map((i) => i.appId))];
  const member = isCommunityMember(community, userId);
  const owner = isCommunityOwner(community, userId);
  const admin = communityAdmin.isCommunityAdmin(community, userId);
  obj.isMember = member;
  obj.isOwner = owner;
  obj.isAdmin = admin;
  obj.isCommunityManager = owner || admin;
  obj.admins = communityAdmin.serializeAdminsList(community);
  obj.canViewFull = canViewCommunity(community, userId);
  obj.canPost = canPostInCommunity(community, userId);
  if (obj.membersCanPost === undefined) obj.membersCanPost = true;
  obj.requiresJoinCode = hasJoinCode(community);
  if (owner || admin) {
    obj.adminPermissions = communityAdmin.getAdminPermissions(community);
  }
  if (!owner) {
    delete obj.joinCode;
  }
  return obj;
}

function communityAccessPreview(community) {
  return {
    name: community.name,
    handle: community.handle,
    description: community.description,
    avatar: community.avatar,
    banner: community.banner,
    memberCount: community.memberCount,
    isPublic: community.isPublic !== false,
    category: community.category,
    requiresJoinCode: hasJoinCode(community),
  };
}

function findChatInstance(community, instanceId) {
  return (community.installedAppInstances || []).find((i) => i.id === instanceId && i.appId === 'chat');
}

function findAppInstance(community, instanceId, appId) {
  return (community.installedAppInstances || []).find((i) => i.id === instanceId && i.appId === appId);
}

function defaultCourseChapters() {
  return [
    {
      title: 'Chapter 1',
      order: 0,
      lessons: [
        {
          title: 'Lesson 1',
          lessonType: 'multimedia',
          videoEmbedUrl: '',
          content: '',
          images: [],
          attachments: [],
          dripLabel: 'Unlocks immediately',
          isLocked: false,
          unlockAfterDays: 0,
        },
      ],
    },
  ];
}

function lessonUnlockedForMember(lesson, joinedAt, now = new Date()) {
  if (lesson.isLocked) return false;
  const days = Math.max(0, Number(lesson.unlockAfterDays) || 0);
  if (days <= 0) return true;
  const unlockAt = new Date(joinedAt);
  unlockAt.setDate(unlockAt.getDate() + days);
  return now >= unlockAt;
}

function lockedLessonPlaceholder(ls, dripLabel) {
  return {
    _id: ls._id,
    title: ls.title,
    lessonType: ls.lessonType,
    isLocked: Boolean(ls.isLocked),
    isAccessible: false,
    dripLabel: dripLabel || ls.dripLabel,
    unlockAfterDays: Number(ls.unlockAfterDays) || 0,
    videoEmbedUrl: '',
    content: '',
    images: [],
    attachments: [],
  };
}

function sanitizeLessonForViewer(lesson, joinedAt, isOwner) {
  const ls = lesson && typeof lesson.toObject === 'function' ? lesson.toObject() : { ...lesson };
  if (isOwner) {
    return { ...ls, isAccessible: true };
  }
  const unlocked = lessonUnlockedForMember(ls, joinedAt);
  if (unlocked) {
    return { ...ls, isAccessible: true };
  }
  return lockedLessonPlaceholder(ls);
}

function sanitizeCourseForViewer(course, community, userId, isOwner) {
  const obj = course && typeof course.toObject === 'function' ? course.toObject() : { ...course };
  if (isOwner) {
    return { ...obj, viewerRole: 'owner' };
  }
  const joinedAt = getMemberJoinedAt(community, userId);
  const sequential = Boolean(obj.sequentialUnlock);
  let chainOpen = true;
  const chapters = (obj.chapters || []).map((ch) => ({
    ...ch,
    lessons: (ch.lessons || []).map((ls) => {
      if (sequential && !chainOpen) {
        return lockedLessonPlaceholder(ls, 'Complete previous lessons first');
      }
      const sanitized = sanitizeLessonForViewer(ls, joinedAt, false);
      if (!sanitized.isAccessible) chainOpen = false;
      return sanitized;
    }),
  }));
  return { ...obj, chapters, viewerRole: 'member' };
}

function canAccessChatInstance(community, userId, instance) {
  if (!instance) return false;
  if (!isCommunityMember(community, userId)) return false;
  if (isCommunityOwner(community, userId)) return true;
  return instance.visibleToMembers;
}

function compareObjectIdAsTime(a, b) {
  if (!a || !b) return 0;
  const sa = String(a);
  const sb = String(b);
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

async function enrichChatMessagesWithReadReceipts(messages, community, instanceId, viewerUserId) {
  if (!messages || !messages.length) {
    return [];
  }
  const states = await CommunityChatReadState.find({
    community: community._id,
    chatInstanceId: String(instanceId),
  }).lean();
  const byUser = new Map(states.map((s) => [String(s.user), s.lastReadMessageId]));
  const memberIds = community.members.map((m) => String(m));
  const viewer = String(viewerUserId);
  const others = memberIds.filter((id) => id !== viewer);
  const otherMembersCount = others.length;

  return messages.map((m) => {
    const plain = m.toObject ? m.toObject() : { ...m };
    const authorId = plain.author?._id ? String(plain.author._id) : String(plain.author);
    if (authorId !== viewer) return plain;

    const msgId = String(plain._id);
    let readByOthers = 0;
    for (const uid of others) {
      const lr = byUser.get(uid);
      if (lr && compareObjectIdAsTime(lr, msgId) >= 0) readByOthers += 1;
    }
    plain.readByOthers = readByOthers;
    plain.otherMembersCount = otherMembersCount;
    return plain;
  });
}

// @route   POST /api/communities
// @desc    Создать новое сообщество
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, handle, description, avatar, banner, category, isPublic, isPaid, price } = req.body;

    // Проверяем, свободен ли handle
    const existingCommunity = await Community.findOne({ handle: handle.toLowerCase() });
    if (existingCommunity) {
      return res.status(400).json({ message: 'Community handle already taken' });
    }

    const createdAt = new Date();
    const newCommunity = new Community({
      name,
      handle: handle.toLowerCase(),
      description,
      avatar,
      banner,
      owner: req.userId,
      members: [req.userId],
      memberJoins: [{ userId: req.userId, joinedAt: createdAt }],
      category: category || 'Other',
      isPublic: isPublic !== undefined ? isPublic : true,
      isPaid: isPaid || false,
      price: price || 0,
      createdAt,
    });

    await newCommunity.save();

    // Добавляем сообщество в список созданных у пользователя
    await User.findByIdAndUpdate(req.userId, {
      $push: { ownedCommunities: newCommunity._id, joinedCommunities: newCommunity._id }
    });

    res.status(201).json(newCommunity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/mine
// @desc    Сообщества, созданные текущим пользователем (владелец)
// @access  Private
router.get('/mine', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const communities = await Community.find({ owner: req.userId })
      .sort({ createdAt: -1 })
      .select('name handle avatar memberCount category createdAt');

    res.json(communities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/list
// @desc    All communities for Discover (public and private)
// @access  Public
router.get('/list', async (req, res) => {
  try {
    const communities = await Community.find()
      .sort({ memberCount: -1 })
      .populate('owner', 'username fullName avatar');
    
    console.log(`Found ${communities.length} communities`);
    res.json(communities);
  } catch (err) {
    console.error('Error fetching communities:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/communities/:handle/branding
// @desc    Загрузить аватар и/или обложку (только владелец)
// @access  Private
router.post('/:handle/branding', auth, (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const upload = communityBrandingUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]);
  upload(req, res, (err) => {
    if (err) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message || 'Upload failed';
      return res.status(400).json({ message: msg });
    }
    next();
  });
}, async (req, res) => {
  try {
    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can update branding' });
    }

    const avatarFile = req.files?.avatar?.[0];
    const bannerFile = req.files?.banner?.[0];
    if (!avatarFile && !bannerFile) {
      return res.status(400).json({ message: 'Send avatar and/or banner as multipart files' });
    }

    const finalDir = path.join(UPLOADS_ROOT, 'community-branding', handle);
    await fs.mkdir(finalDir, { recursive: true });
    const hostBase = `${req.protocol}://${req.get('host')}`;

    const moveToBranding = async (file, field) => {
      const ext =
        path.extname(file.originalname) ||
        ({ 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' }[
          file.mimetype
        ] || '.img');
      const safeBase = `${field}-${Date.now()}${ext}`;
      const destAbs = path.join(finalDir, safeBase);
      await fs.rename(file.path, destAbs);
      const relPosix = `community-branding/${handle}/${safeBase}`.split(path.sep).join('/');
      return `${hostBase}/uploads/${relPosix}`;
    };

    const out = {};
    if (avatarFile) {
      community.avatar = await moveToBranding(avatarFile, 'avatar');
      out.avatar = community.avatar;
    }
    if (bannerFile) {
      community.banner = await moveToBranding(bannerFile, 'banner');
      out.banner = community.banner;
    }

    await community.save();
    const updated = await Community.findById(community._id).populate('owner', 'username fullName avatar');
    res.json({ ...serializeCommunityDoc(updated, req.userId), ...out });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle
// @desc    Обновить сообщество (только владелец)
// @access  Private
router.patch('/:handle', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle });

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    if (!communityAdmin.hasAdminPermission(community, req.userId, 'canManageSettings')) {
      return res.status(403).json({ message: 'You do not have permission to update this community' });
    }

    const allowed = [
      'name',
      'description',
      'avatar',
      'banner',
      'category',
      'isPublic',
      'isPaid',
      'price',
      'chatPublic',
      'membersCanPost',
      'joinCode',
    ];
    const categories = ['Memecoins', 'Futures', 'On-Chain', 'Airdrops', 'Education', 'DeFi', 'NFT', 'Other'];

    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      if (key === 'category' && !categories.includes(req.body.category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      if (key === 'name' && (!req.body.name || !String(req.body.name).trim())) {
        return res.status(400).json({ message: 'Name is required' });
      }
      if (key === 'description' && (!req.body.description || !String(req.body.description).trim())) {
        return res.status(400).json({ message: 'Description is required' });
      }
      if (key === 'price' && typeof req.body.price === 'number' && req.body.price < 0) {
        return res.status(400).json({ message: 'Invalid price' });
      }
      if (key === 'chatPublic' && typeof req.body.chatPublic !== 'boolean') {
        return res.status(400).json({ message: 'chatPublic must be boolean' });
      }
      if (key === 'membersCanPost' && typeof req.body.membersCanPost !== 'boolean') {
        return res.status(400).json({ message: 'membersCanPost must be boolean' });
      }
      if (key === 'isPublic' && typeof req.body.isPublic !== 'boolean') {
        return res.status(400).json({ message: 'isPublic must be boolean' });
      }
      if (key === 'banner' || key === 'avatar') {
        const val = req.body[key] == null ? '' : String(req.body[key]).trim();
        if (val && !val.startsWith('/uploads/')) {
          try {
            const parsed = new URL(val);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              return res.status(400).json({ message: `Invalid ${key} URL` });
            }
          } catch {
            return res.status(400).json({ message: `Invalid ${key} URL` });
          }
        }
        community[key] = val;
        continue;
      }
      if (key === 'joinCode') {
        if (req.body.joinCode !== null && req.body.joinCode !== undefined && typeof req.body.joinCode !== 'string') {
          return res.status(400).json({ message: 'joinCode must be a string' });
        }
        const val =
          req.body.joinCode == null || req.body.joinCode === undefined
            ? ''
            : String(req.body.joinCode).trim();
        if (val.length > 64) {
          return res.status(400).json({ message: 'joinCode must be at most 64 characters' });
        }
        community.joinCode = val;
        continue;
      }
      community[key] = req.body[key];
    }

    await community.save();
    const updated = await Community.findById(community._id).populate('owner', 'username fullName avatar');
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle
// @desc    Удалить сообщество (только владелец)
// @access  Private
router.delete('/:handle', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can delete this community' });
    }
    await deleteCommunityCascade(community);
    res.json({ message: 'Community deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/apps
// @desc    Установить приложение в сообщество (пока только владелец)
// @access  Private
router.post('/:handle/apps', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { appId, title, visibleToMembers, note } = req.body;
    if (!appId || !ALLOWED_COMMUNITY_APPS.includes(appId)) {
      return res.status(400).json({ message: 'Unknown or unsupported app' });
    }

    const community = await communityByHandle(req.params.handle);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can install apps' });
    }

    await migrateLegacyInstances(community);
    const reloaded = await communityByHandle(req.params.handle);
    if (!reloaded) return res.status(404).json({ message: 'Community not found' });

    const instances = reloaded.installedAppInstances || [];
    const hasAnyChat = instances.some((i) => i.appId === 'chat');
    const newId = appId === 'chat' && !hasAnyChat ? 'default' : crypto.randomUUID();
    const defaultTitle =
      appId === 'chat'
        ? 'Chat'
        : appId === 'courses'
          ? 'Courses'
          : appId === 'content'
            ? 'Content'
            : appId === 'files'
              ? 'Files'
              : appId === 'announcements'
                ? 'Announcements'
                : appId === 'events'
                  ? 'Events'
                  : String(appId);
    const next = [
      ...instances,
      {
        id: newId,
        appId,
        title: String(title || '').trim() || defaultTitle,
        visibleToMembers: visibleToMembers !== false,
        note: String(note || '').trim().slice(0, 500),
      },
    ];
    reloaded.installedAppInstances = next;
    syncInstalledAppsFromInstances(reloaded);
    await reloaded.save();
    const updated = await Community.findById(reloaded._id).populate('owner', 'username fullName avatar');
    res.json({ ...serializeCommunityDoc(updated, req.userId), newInstanceId: newId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/apps/instances/:instanceId
// @desc    Обновить экземпляр приложения (название, видимость, заметка)
// @access  Private (owner)
router.patch('/:handle/apps/instances/:instanceId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can update apps' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instanceId = req.params.instanceId;
    const instances = fresh.installedAppInstances || [];
    const idx = instances.findIndex((i) => i.id === instanceId);
    if (idx === -1) return res.status(404).json({ message: 'Instance not found' });

    const { title, visibleToMembers, note } = req.body;
    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) return res.status(400).json({ message: 'Title cannot be empty' });
      instances[idx].title = t.slice(0, 120);
    }
    if (visibleToMembers !== undefined) {
      if (typeof visibleToMembers !== 'boolean') {
        return res.status(400).json({ message: 'visibleToMembers must be boolean' });
      }
      instances[idx].visibleToMembers = visibleToMembers;
    }
    if (note !== undefined) {
      instances[idx].note = String(note).slice(0, 500);
    }
    fresh.installedAppInstances = instances;
    syncInstalledAppsFromInstances(fresh);
    await fresh.save();
    const updated = await Community.findById(fresh._id).populate('owner', 'username fullName avatar');
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/apps/instances/:instanceId
// @desc    Удалить один экземпляр приложения
// @access  Private (owner)
router.delete('/:handle/apps/instances/:instanceId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can remove apps' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instanceId = req.params.instanceId;
    const instances = (fresh.installedAppInstances || []).filter((i) => i.id !== instanceId);
    const removed = (fresh.installedAppInstances || []).find((i) => i.id === instanceId);
    if (!removed) return res.status(404).json({ message: 'Instance not found' });

    fresh.installedAppInstances = instances;
    syncInstalledAppsFromInstances(fresh);
    await fresh.save();

    if (removed.appId === 'chat') {
      await CommunityChatMessage.deleteMany({ community: fresh._id, chatInstanceId: instanceId });
      await CommunityChatReadState.deleteMany({ community: fresh._id, chatInstanceId: instanceId });
    }
    if (removed.appId === 'courses') {
      await CommunityCourse.deleteMany({ community: fresh._id, appInstanceId: instanceId });
    }
    if (removed.appId === 'content') {
      await CommunityContentDocument.deleteMany({ community: fresh._id, appInstanceId: instanceId });
    }
    if (removed.appId === 'files') {
      await deleteAllCommunityFilesForInstance(fresh._id, instanceId);
    }
    if (removed.appId === 'announcements') {
      await deleteAnnouncementsForInstance(fresh._id, instanceId);
    }
    if (removed.appId === 'events') {
      await deleteEventsForInstance(fresh._id, instanceId);
    }

    const updated = await Community.findById(fresh._id).populate('owner', 'username fullName avatar');
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/apps/:appId
// @desc    Удалить приложение из сообщества (владелец)
// @access  Private
router.delete('/:handle/apps/:appId', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const appId = req.params.appId;
    if (!ALLOWED_COMMUNITY_APPS.includes(appId)) {
      return res.status(400).json({ message: 'Unknown app' });
    }

    const community = await communityByHandle(req.params.handle);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can remove apps' });
    }

    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instances = (fresh.installedAppInstances || []).filter((i) => i.appId !== appId);
    const removedIds = (fresh.installedAppInstances || []).filter((i) => i.appId === appId).map((i) => i.id);
    fresh.installedAppInstances = instances;
    syncInstalledAppsFromInstances(fresh);
    await fresh.save();

    if (appId === 'chat' && removedIds.length) {
      await CommunityChatMessage.deleteMany({
        community: fresh._id,
        chatInstanceId: { $in: removedIds },
      });
      await CommunityChatReadState.deleteMany({
        community: fresh._id,
        chatInstanceId: { $in: removedIds },
      });
    }
    if (appId === 'courses' && removedIds.length) {
      await CommunityCourse.deleteMany({
        community: fresh._id,
        appInstanceId: { $in: removedIds },
      });
    }
    if (appId === 'content' && removedIds.length) {
      await CommunityContentDocument.deleteMany({
        community: fresh._id,
        appInstanceId: { $in: removedIds },
      });
    }
    if (appId === 'files' && removedIds.length) {
      for (const iid of removedIds) {
        await deleteAllCommunityFilesForInstance(fresh._id, iid);
      }
    }
    if (appId === 'announcements' && removedIds.length) {
      for (const iid of removedIds) {
        await deleteAnnouncementsForInstance(fresh._id, iid);
      }
    }
    if (appId === 'events' && removedIds.length) {
      for (const iid of removedIds) {
        await deleteEventsForInstance(fresh._id, iid);
      }
    }

    const updated = await Community.findById(fresh._id).populate('owner', 'username fullName avatar');
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/chat/unread
// @desc    Количество непрочитанных по каждому экземпляру чата
// @access  Private
router.get('/:handle/chat/unread', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const community = await communityByHandle(req.params.handle);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instances = filterInstancesForViewer(fresh, req.userId).filter((i) => i.appId === 'chat');
    const viewerOid = new mongoose.Types.ObjectId(req.userId);
    const counts = {};

    for (const inst of instances) {
      if (!canAccessChatInstance(fresh, req.userId, inst)) continue;
      const state = await CommunityChatReadState.findOne({
        user: req.userId,
        community: fresh._id,
        chatInstanceId: inst.id,
      }).lean();
      const cursor = state?.lastReadMessageId;
      const base = { community: fresh._id, chatInstanceId: inst.id, author: { $ne: viewerOid } };
      let n;
      if (!cursor) {
        n = await CommunityChatMessage.countDocuments(base);
      } else {
        n = await CommunityChatMessage.countDocuments({ ...base, _id: { $gt: cursor } });
      }
      counts[inst.id] = n;
    }

    res.json({ counts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/chat/read
// @desc    Отметить сообщения прочитанными до lastReadMessageId
// @access  Private
router.post('/:handle/chat/read', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { instanceId, lastReadMessageId } = req.body;
    if (!instanceId || !lastReadMessageId) {
      return res.status(400).json({ message: 'instanceId and lastReadMessageId are required' });
    }

    const community = await communityByHandle(req.params.handle);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findChatInstance(fresh, String(instanceId));
    if (!instance) {
      return res.status(404).json({ message: 'Chat instance not found' });
    }
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access this chat' });
    }

    const newId = new mongoose.Types.ObjectId(String(lastReadMessageId));
    const exists = await CommunityChatMessage.exists({
      _id: newId,
      community: fresh._id,
      chatInstanceId: String(instanceId),
    });
    if (!exists) {
      return res.status(400).json({ message: 'Invalid message id' });
    }

    let doc = await CommunityChatReadState.findOne({
      user: req.userId,
      community: fresh._id,
      chatInstanceId: String(instanceId),
    });
    if (!doc) {
      await CommunityChatReadState.create({
        user: req.userId,
        community: fresh._id,
        chatInstanceId: String(instanceId),
        lastReadMessageId: newId,
        updatedAt: new Date(),
      });
    } else if (!doc.lastReadMessageId || compareObjectIdAsTime(newId, doc.lastReadMessageId) > 0) {
      doc.lastReadMessageId = newId;
      doc.updatedAt = new Date();
      await doc.save();
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/chat/messages
// @desc    Сообщения чата сообщества (только участники, если установлен Chat)
// @access  Private
router.get('/:handle/chat/messages', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const community = await communityByHandle(req.params.handle);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instanceId = (req.query.instanceId && String(req.query.instanceId)) || 'default';
    const instance = findChatInstance(fresh, instanceId);
    if (!instance) {
      return res.status(404).json({ message: 'Chat instance not found' });
    }
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access this chat' });
    }

    const messages = await CommunityChatMessage.find({ community: fresh._id, chatInstanceId: instanceId })
      .sort({ createdAt: 1 })
      .limit(300)
      .populate('author', 'username fullName avatar');

    const enriched = await enrichChatMessagesWithReadReceipts(messages, fresh, instanceId, req.userId);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/chat/messages
// @desc    Отправить сообщение в чат
// @access  Private
router.post('/:handle/chat/messages', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const instanceId = (req.body.instanceId && String(req.body.instanceId)) || 'default';

    const community = await communityByHandle(req.params.handle);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findChatInstance(fresh, instanceId);
    if (!instance) {
      return res.status(404).json({ message: 'Chat instance not found' });
    }
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot post in this chat' });
    }

    const msg = new CommunityChatMessage({
      community: fresh._id,
      author: req.userId,
      content,
      chatInstanceId: instanceId,
    });
    await msg.save();
    const populated = await CommunityChatMessage.findById(msg._id)
      .populate('author', 'username fullName avatar');
    const arr = await enrichChatMessagesWithReadReceipts([populated], fresh, instanceId, req.userId);
    res.status(201).json(arr[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Courses app (per installed app instance) ---

// @route   GET /api/communities/:handle/courses/:courseId
// @desc    Полный курс с главами и уроками
// @access  Private (участник + доступ к экземпляру приложения)
router.get('/:handle/courses/:courseId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'courses');
    if (!instance) return res.status(404).json({ message: 'Courses instance not found' });
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access this app' });
    }

    const course = await CommunityCourse.findOne({
      _id: req.params.courseId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const owner = isCommunityOwner(fresh, req.userId);
    if (course.isHidden && !owner) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(sanitizeCourseForViewer(course, fresh, req.userId, owner));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/courses
// @desc    Список курсов (без полного дерева уроков)
// @access  Private
router.get('/:handle/courses', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'courses');
    if (!instance) return res.status(404).json({ message: 'Courses instance not found' });
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access this app' });
    }

    const owner = isCommunityOwner(fresh, req.userId);
    const rows = await CommunityCourse.find(
      owner
        ? { community: fresh._id, appInstanceId: instanceId }
        : { community: fresh._id, appInstanceId: instanceId, isHidden: false }
    )
      .sort({ updatedAt: -1 })
      .select('name description isHidden coverUrl updatedAt createdAt')
      .lean();

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/courses
// @desc    Создать курс (только владелец)
// @access  Private
router.post('/:handle/courses', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const { instanceId, name, description, isHidden, coverUrl } = req.body;
    const iid = String(instanceId || '').trim();
    if (!iid) return res.status(400).json({ message: 'instanceId required' });
    const title = String(name || '').trim();
    if (!title) return res.status(400).json({ message: 'Name is required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can create courses' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, iid, 'courses');
    if (!instance) return res.status(404).json({ message: 'Courses instance not found' });

    const course = new CommunityCourse({
      community: fresh._id,
      appInstanceId: iid,
      createdBy: req.userId,
      name: title.slice(0, 200),
      description: String(description || '').slice(0, 10000),
      isHidden: Boolean(isHidden),
      coverUrl: String(coverUrl || '').slice(0, 500000),
      chapters: defaultCourseChapters(),
    });
    await course.save();
    res.status(201).json(course.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/courses/:courseId
// @desc    Обновить курс / структуру
// @access  Private (владелец)
router.patch('/:handle/courses/:courseId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can edit courses' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'courses');
    if (!instance) return res.status(404).json({ message: 'Courses instance not found' });

    const course = await CommunityCourse.findOne({
      _id: req.params.courseId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const {
      name,
      description,
      isHidden,
      coverUrl,
      welcomeMessage,
      completionMessage,
      sequentialUnlock,
      defaultLessonUnlockDays,
      tags,
      chapters,
    } = req.body;
    if (name !== undefined) {
      const t = String(name).trim();
      if (!t) return res.status(400).json({ message: 'Name cannot be empty' });
      course.name = t.slice(0, 200);
    }
    if (description !== undefined) course.description = String(description).slice(0, 10000);
    if (isHidden !== undefined) course.isHidden = Boolean(isHidden);
    if (coverUrl !== undefined) course.coverUrl = String(coverUrl).slice(0, 500000);
    if (welcomeMessage !== undefined) course.welcomeMessage = String(welcomeMessage).slice(0, 5000);
    if (completionMessage !== undefined) course.completionMessage = String(completionMessage).slice(0, 5000);
    if (sequentialUnlock !== undefined) course.sequentialUnlock = Boolean(sequentialUnlock);
    if (defaultLessonUnlockDays !== undefined) {
      course.defaultLessonUnlockDays = Math.max(0, Math.min(365, Number(defaultLessonUnlockDays) || 0));
    }
    if (tags !== undefined) {
      if (!Array.isArray(tags)) return res.status(400).json({ message: 'tags must be an array' });
      course.tags = tags
        .map((tag) => String(tag).trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 20);
      course.markModified('tags');
    }
    if (chapters !== undefined) {
      if (!Array.isArray(chapters)) return res.status(400).json({ message: 'chapters must be an array' });
      if (chapters.length > 80) return res.status(400).json({ message: 'Too many chapters' });
      course.chapters = chapters;
      course.markModified('chapters');
    }

    await course.save();
    res.json(course.toObject());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/courses/:courseId
// @desc    Удалить курс
// @access  Private (владелец)
router.delete('/:handle/courses/:courseId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can delete courses' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'courses');
    if (!instance) return res.status(404).json({ message: 'Courses instance not found' });

    const result = await CommunityCourse.deleteOne({
      _id: req.params.courseId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!result.deletedCount) return res.status(404).json({ message: 'Course not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Content app (один документ на экземпляр) ---

// @route   GET /api/communities/:handle/content
// @desc    Документ Content для экземпляра приложения
// @access  Private (участник с доступом к экземпляру)
router.get('/:handle/content', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'content');
    if (!instance) return res.status(404).json({ message: 'Content instance not found' });
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access this app' });
    }

    const doc = await CommunityContentDocument.findOne({
      community: fresh._id,
      appInstanceId: instanceId,
    }).lean();

    if (!doc) {
      return res.json({ title: 'Unnamed document', body: '' });
    }
    res.json({
      _id: doc._id,
      title: doc.title || 'Unnamed document',
      body: doc.body || '',
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/content
// @desc    Сохранить документ Content
// @access  Private (владелец сообщества)
router.patch('/:handle/content', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can edit this document' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'content');
    if (!instance) return res.status(404).json({ message: 'Content instance not found' });

    const { title, body } = req.body;
    let doc = await CommunityContentDocument.findOne({
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!doc) {
      doc = new CommunityContentDocument({
        community: fresh._id,
        appInstanceId: instanceId,
        title: 'Unnamed document',
        body: '',
      });
    }
    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) return res.status(400).json({ message: 'Title cannot be empty' });
      doc.title = t.slice(0, 500);
    }
    if (body !== undefined) {
      doc.body = String(body).slice(0, 500000);
    }
    await doc.save();
    res.json({
      _id: doc._id,
      title: doc.title,
      body: doc.body,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Files app ---

// @route   GET /api/communities/:handle/files/:fileId/download
// @access  Private (участник с доступом к экземпляру)
router.get('/:handle/files/:fileId/download', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'files');
    if (!instance) return res.status(404).json({ message: 'Files instance not found' });
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access these files' });
    }

    const file = await CommunityFile.findOne({
      _id: req.params.fileId,
      community: fresh._id,
      appInstanceId: instanceId,
    }).lean();
    if (!file) return res.status(404).json({ message: 'File not found' });

    const abs = path.join(UPLOADS_ROOT, file.relativePath);
    res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
    const enc = encodeURIComponent(file.originalName).replace(/'/g, '%27');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${enc}`);
    const stream = fssync.createReadStream(abs);
    stream.on('error', () => {
      if (!res.headersSent) res.status(404).end();
    });
    stream.pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/files/:fileId
// @access  Private (владелец)
router.delete('/:handle/files/:fileId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can delete files' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'files');
    if (!instance) return res.status(404).json({ message: 'Files instance not found' });

    const file = await CommunityFile.findOne({
      _id: req.params.fileId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!file) return res.status(404).json({ message: 'File not found' });

    await unlinkCommunityFileRelative(file.relativePath);
    await file.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/files
// @access  Private
router.get('/:handle/files', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'files');
    if (!instance) return res.status(404).json({ message: 'Files instance not found' });
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot access these files' });
    }

    const q = String(req.query.q || '').trim();
    const sortParam = String(req.query.sort || 'nameAsc');
    const filter = { community: fresh._id, appInstanceId: instanceId };
    if (q) {
      filter.originalName = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    let sort = { originalName: 1 };
    if (sortParam === 'nameDesc') sort = { originalName: -1 };
    if (sortParam === 'dateDesc') sort = { createdAt: -1 };

    const rows = await CommunityFile.find(filter).sort(sort).lean();
    res.json(
      rows.map((r) => ({
        _id: r._id,
        originalName: r.originalName,
        mimeType: r.mimeType,
        size: r.size,
        createdAt: r.createdAt,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/files
// @access  Private (владелец)
router.post('/:handle/files', auth, communityFileUpload.single('file'), async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'file field is required' });

    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: 'instanceId is required' });
    }

    const community = await communityByHandle(req.params.handle);
    if (!community) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(403).json({ message: 'Only the owner can upload files' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'files');
    if (!instance) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(404).json({ message: 'Files instance not found' });
    }

    const orig = req.file.originalname || req.file.originalName || 'file';
    const ext = path.extname(orig).slice(0, 12);
    const destName = `${crypto.randomUUID()}${ext}`;
    const destDir = path.join(UPLOADS_ROOT, 'community-files', String(fresh._id), instanceId);
    fssync.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, destName);
    await fs.rename(req.file.path, destPath);

    const relativePath = path.posix.join('community-files', String(fresh._id), instanceId, destName);

    const doc = await CommunityFile.create({
      community: fresh._id,
      appInstanceId: instanceId,
      originalName: String(orig).slice(0, 400),
      mimeType: String(req.file.mimetype || '').slice(0, 200),
      size: typeof req.file.size === 'number' ? req.file.size : 0,
      relativePath,
      uploadedBy: req.userId,
    });

    res.status(201).json({
      _id: doc._id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      createdAt: doc.createdAt,
    });
  } catch (err) {
    console.error(err);
    if (req.file?.path) await fs.unlink(req.file.path).catch(() => {});
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Announcements app ---

async function resolveAnnouncementsInstance(req, res) {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  const instanceId = String(req.query.instanceId || req.body.instanceId || '').trim();
  if (!instanceId) {
    res.status(400).json({ message: 'instanceId required' });
    return null;
  }
  const community = await communityByHandle(req.params.handle);
  if (!community) {
    res.status(404).json({ message: 'Community not found' });
    return null;
  }
  await migrateLegacyInstances(community);
  const fresh = await communityByHandle(req.params.handle);
  const instance = findAppInstance(fresh, instanceId, 'announcements');
  if (!instance) {
    res.status(404).json({ message: 'Announcements instance not found' });
    return null;
  }
  if (!canAccessChatInstance(fresh, req.userId, instance)) {
    res.status(403).json({ message: 'You cannot access this app' });
    return null;
  }
  return { fresh, instanceId };
}

// @route   GET /api/communities/:handle/announcements/meta
router.get('/:handle/announcements/meta', auth, async (req, res) => {
  try {
    const ctx = await resolveAnnouncementsInstance(req, res);
    if (!ctx) return;
    const { fresh, instanceId } = ctx;
    const meta = await CommunityAnnouncementMeta.findOne({
      community: fresh._id,
      appInstanceId: instanceId,
    }).lean();
    if (!meta) {
      return res.json({ wizardComplete: false, templateKey: '', audienceSize: '' });
    }
    return res.json({
      wizardComplete: Boolean(meta.wizardComplete),
      templateKey: meta.templateKey || '',
      audienceSize: meta.audienceSize || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/announcements/meta
router.patch('/:handle/announcements/meta', auth, async (req, res) => {
  try {
    const ctx = await resolveAnnouncementsInstance(req, res);
    if (!ctx) return;
    const { fresh, instanceId } = ctx;
    if (!isCommunityOwner(fresh, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can update setup' });
    }
    let doc = await CommunityAnnouncementMeta.findOne({
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!doc) {
      doc = new CommunityAnnouncementMeta({
        community: fresh._id,
        appInstanceId: instanceId,
        wizardComplete: false,
      });
    }
    if (req.body.templateKey !== undefined) {
      doc.templateKey = String(req.body.templateKey || '').slice(0, 80);
    }
    if (req.body.audienceSize !== undefined) {
      doc.audienceSize = String(req.body.audienceSize || '').slice(0, 80);
    }
    if (req.body.wizardComplete !== undefined) {
      doc.wizardComplete = Boolean(req.body.wizardComplete);
    }
    await doc.save();
    res.json({
      wizardComplete: doc.wizardComplete,
      templateKey: doc.templateKey || '',
      audienceSize: doc.audienceSize || '',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/announcements
router.get('/:handle/announcements', auth, async (req, res) => {
  try {
    const ctx = await resolveAnnouncementsInstance(req, res);
    if (!ctx) return;
    const { fresh, instanceId } = ctx;
    const rows = await CommunityAnnouncement.find({
      community: fresh._id,
      appInstanceId: instanceId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('author', 'username fullName avatar')
      .lean();
    res.json(
      rows.map((a) => ({
        _id: a._id,
        title: a.title,
        body: a.body,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        author: a.author,
        commentsCount: a.commentsCount ?? 0,
        viewsCount: a.viewsCount ?? 0,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/announcements
router.post('/:handle/announcements', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can publish announcements' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'announcements');
    if (!instance) return res.status(404).json({ message: 'Announcements instance not found' });

    const title = String(req.body.title || '').trim();
    const body = String(req.body.body || '');
    if (!title) return res.status(400).json({ message: 'Title is required' });

    const ann = await CommunityAnnouncement.create({
      community: fresh._id,
      appInstanceId: instanceId,
      title: title.slice(0, 400),
      body: body.slice(0, 50000),
      author: req.userId,
    });

    if (req.body.completeSetup) {
      await CommunityAnnouncementMeta.findOneAndUpdate(
        { community: fresh._id, appInstanceId: instanceId },
        { $set: { wizardComplete: true } },
        { upsert: true, new: true }
      );
    }

    const populated = await CommunityAnnouncement.findById(ann._id)
      .populate('author', 'username fullName avatar')
      .lean();
    res.status(201).json({
      _id: populated._id,
      title: populated.title,
      body: populated.body,
      createdAt: populated.createdAt,
      author: populated.author,
      commentsCount: 0,
      viewsCount: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/announcements/:announcementId
router.get('/:handle/announcements/:announcementId', auth, async (req, res) => {
  try {
    const ctx = await resolveAnnouncementsInstance(req, res);
    if (!ctx) return;
    const { fresh, instanceId } = ctx;

    const ann = await CommunityAnnouncement.findOne({
      _id: req.params.announcementId,
      community: fresh._id,
      appInstanceId: instanceId,
    })
      .populate('author', 'username fullName avatar')
      .populate('comments.user', 'username fullName avatar');

    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    ann.viewsCount = (ann.viewsCount || 0) + 1;
    await ann.save();

    const plain = ann.toObject();
    res.json({
      _id: plain._id,
      title: plain.title,
      body: plain.body,
      createdAt: plain.createdAt,
      author: plain.author,
      comments: (plain.comments || []).map((c) => ({
        _id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        user: c.user,
      })),
      commentsCount: plain.commentsCount ?? 0,
      viewsCount: plain.viewsCount ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/announcements/:announcementId
router.patch('/:handle/announcements/:announcementId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can edit announcements' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'announcements');
    if (!instance) return res.status(404).json({ message: 'Announcements instance not found' });

    const ann = await CommunityAnnouncement.findOne({
      _id: req.params.announcementId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    if (req.body.title !== undefined) {
      const t = String(req.body.title || '').trim();
      if (!t) return res.status(400).json({ message: 'Title cannot be empty' });
      ann.title = t.slice(0, 400);
    }
    if (req.body.body !== undefined) {
      ann.body = String(req.body.body || '').slice(0, 50000);
    }
    await ann.save();
    const populated = await CommunityAnnouncement.findById(ann._id)
      .populate('author', 'username fullName avatar')
      .lean();
    res.json({
      _id: populated._id,
      title: populated.title,
      body: populated.body,
      createdAt: populated.createdAt,
      author: populated.author,
      commentsCount: populated.commentsCount ?? 0,
      viewsCount: populated.viewsCount ?? 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/announcements/:announcementId
router.delete('/:handle/announcements/:announcementId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can delete announcements' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'announcements');
    if (!instance) return res.status(404).json({ message: 'Announcements instance not found' });

    const result = await CommunityAnnouncement.deleteOne({
      _id: req.params.announcementId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!result.deletedCount) return res.status(404).json({ message: 'Announcement not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/announcements/:announcementId/comments
router.post('/:handle/announcements/:announcementId/comments', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });
    const content = String(req.body.content || '').trim();
    if (!content) return res.status(400).json({ message: 'Comment is required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'announcements');
    if (!instance) return res.status(404).json({ message: 'Announcements instance not found' });
    if (!canAccessChatInstance(fresh, req.userId, instance)) {
      return res.status(403).json({ message: 'You cannot comment here' });
    }
    if (!isCommunityMember(fresh, req.userId)) {
      return res.status(403).json({ message: 'Join the community to comment' });
    }

    const ann = await CommunityAnnouncement.findOne({
      _id: req.params.announcementId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    ann.comments.push({ user: req.userId, content: content.slice(0, 2000) });
    ann.commentsCount = ann.comments.length;
    await ann.save();

    const last = ann.comments[ann.comments.length - 1];
    const u = await User.findById(req.userId).select('username fullName avatar').lean();
    res.status(201).json({
      _id: last._id,
      content: last.content,
      createdAt: last.createdAt,
      user: u,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- Events app ---

async function resolveEventsInstance(req, res) {
  if (!req.userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return null;
  }
  const instanceId = String(req.query.instanceId || req.body.instanceId || '').trim();
  if (!instanceId) {
    res.status(400).json({ message: 'instanceId required' });
    return null;
  }
  const community = await communityByHandle(req.params.handle);
  if (!community) {
    res.status(404).json({ message: 'Community not found' });
    return null;
  }
  await migrateLegacyInstances(community);
  const fresh = await communityByHandle(req.params.handle);
  const instance = findAppInstance(fresh, instanceId, 'events');
  if (!instance) {
    res.status(404).json({ message: 'Events instance not found' });
    return null;
  }
  if (!canAccessChatInstance(fresh, req.userId, instance)) {
    res.status(403).json({ message: 'You cannot access this app' });
    return null;
  }
  return { fresh, instanceId };
}

// @route   GET /api/communities/:handle/events
router.get('/:handle/events', auth, async (req, res) => {
  try {
    const ctx = await resolveEventsInstance(req, res);
    if (!ctx) return;
    const { fresh, instanceId } = ctx;
    const rows = await CommunityEvent.find({
      community: fresh._id,
      appInstanceId: instanceId,
    })
      .sort({ startsAt: 1 })
      .lean();

    const hostIds = [...new Set(rows.map((r) => String(r.hostUserId)))];
    const hosts = await User.find({ _id: { $in: hostIds } })
      .select('username fullName avatar')
      .lean();
    const hostMap = new Map(hosts.map((h) => [String(h._id), h]));

    res.json(
      rows.map((ev) => {
        const h = hostMap.get(String(ev.hostUserId));
        return {
          _id: ev._id,
          title: ev.title,
          description: ev.description,
          imageUrl: ev.imageUrl || '',
          startsAt: ev.startsAt,
          endsAt: ev.endsAt,
          timezone: ev.timezone,
          repeatRule: ev.repeatRule,
          locationType: ev.locationType,
          locationLabel: ev.locationLabel,
          locationAddress: ev.locationAddress,
          allowRsvp: ev.allowRsvp,
          hostUserId: ev.hostUserId,
          host: h
            ? { _id: h._id, username: h.username, fullName: h.fullName, avatar: h.avatar }
            : null,
          createdAt: ev.createdAt,
          updatedAt: ev.updatedAt,
        };
      })
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/events
router.post('/:handle/events', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can create events' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'events');
    if (!instance) return res.status(404).json({ message: 'Events instance not found' });

    const title = String(req.body.title || '').trim();
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const startsAt = new Date(req.body.startsAt);
    const endsAt = new Date(req.body.endsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end date' });
    }
    if (endsAt <= startsAt) {
      return res.status(400).json({ message: 'End must be after start' });
    }

    const doc = await CommunityEvent.create({
      community: fresh._id,
      appInstanceId: instanceId,
      title: title.slice(0, 300),
      description: String(req.body.description || '').slice(0, 8000),
      imageUrl: String(req.body.imageUrl || '').slice(0, 2000),
      startsAt,
      endsAt,
      timezone: String(req.body.timezone || 'Europe/Moscow').slice(0, 120),
      repeatRule: String(req.body.repeatRule || 'none').slice(0, 80),
      locationType: req.body.locationType === 'place' ? 'place' : 'online',
      locationLabel: String(req.body.locationLabel || 'Google Meet (Online)').slice(0, 200),
      locationAddress: String(req.body.locationAddress || '').slice(0, 500),
      hostUserId: String(req.body.hostUserId || req.userId),
      allowRsvp: Boolean(req.body.allowRsvp),
    });

    const populated = await User.findById(doc.hostUserId).select('username fullName avatar').lean();
    res.status(201).json({
      _id: doc._id,
      title: doc.title,
      description: doc.description,
      imageUrl: doc.imageUrl,
      startsAt: doc.startsAt,
      endsAt: doc.endsAt,
      timezone: doc.timezone,
      repeatRule: doc.repeatRule,
      locationType: doc.locationType,
      locationLabel: doc.locationLabel,
      locationAddress: doc.locationAddress,
      allowRsvp: doc.allowRsvp,
      hostUserId: doc.hostUserId,
      host: populated
        ? {
            _id: populated._id,
            username: populated.username,
            fullName: populated.fullName,
            avatar: populated.avatar,
          }
        : null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/events/:eventId
router.patch('/:handle/events/:eventId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.body.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can edit events' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'events');
    if (!instance) return res.status(404).json({ message: 'Events instance not found' });

    const ev = await CommunityEvent.findOne({
      _id: req.params.eventId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!ev) return res.status(404).json({ message: 'Event not found' });

    if (req.body.title !== undefined) {
      const t = String(req.body.title || '').trim();
      if (!t) return res.status(400).json({ message: 'Title cannot be empty' });
      ev.title = t.slice(0, 300);
    }
    if (req.body.description !== undefined) ev.description = String(req.body.description || '').slice(0, 8000);
    if (req.body.imageUrl !== undefined) ev.imageUrl = String(req.body.imageUrl || '').slice(0, 2000);
    if (req.body.startsAt !== undefined) {
      const d = new Date(req.body.startsAt);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid startsAt' });
      ev.startsAt = d;
    }
    if (req.body.endsAt !== undefined) {
      const d = new Date(req.body.endsAt);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Invalid endsAt' });
      ev.endsAt = d;
    }
    if (ev.endsAt <= ev.startsAt) {
      return res.status(400).json({ message: 'End must be after start' });
    }
    if (req.body.timezone !== undefined) ev.timezone = String(req.body.timezone).slice(0, 120);
    if (req.body.repeatRule !== undefined) ev.repeatRule = String(req.body.repeatRule).slice(0, 80);
    if (req.body.locationType !== undefined) {
      ev.locationType = req.body.locationType === 'place' ? 'place' : 'online';
    }
    if (req.body.locationLabel !== undefined) {
      ev.locationLabel = String(req.body.locationLabel).slice(0, 200);
    }
    if (req.body.locationAddress !== undefined) {
      ev.locationAddress = String(req.body.locationAddress).slice(0, 500);
    }
    if (req.body.allowRsvp !== undefined) ev.allowRsvp = Boolean(req.body.allowRsvp);
    if (req.body.hostUserId !== undefined) ev.hostUserId = String(req.body.hostUserId);

    await ev.save();
    const populated = await User.findById(ev.hostUserId).select('username fullName avatar').lean();
    res.json({
      _id: ev._id,
      title: ev.title,
      description: ev.description,
      imageUrl: ev.imageUrl,
      startsAt: ev.startsAt,
      endsAt: ev.endsAt,
      timezone: ev.timezone,
      repeatRule: ev.repeatRule,
      locationType: ev.locationType,
      locationLabel: ev.locationLabel,
      locationAddress: ev.locationAddress,
      allowRsvp: ev.allowRsvp,
      hostUserId: ev.hostUserId,
      host: populated
        ? {
            _id: populated._id,
            username: populated.username,
            fullName: populated.fullName,
            avatar: populated.avatar,
          }
        : null,
      createdAt: ev.createdAt,
      updatedAt: ev.updatedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/events/:eventId
router.delete('/:handle/events/:eventId', auth, async (req, res) => {
  try {
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });
    const instanceId = String(req.query.instanceId || '').trim();
    if (!instanceId) return res.status(400).json({ message: 'instanceId query required' });

    const community = await communityByHandle(req.params.handle);
    if (!community) return res.status(404).json({ message: 'Community not found' });
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can delete events' });
    }
    await migrateLegacyInstances(community);
    const fresh = await communityByHandle(req.params.handle);
    const instance = findAppInstance(fresh, instanceId, 'events');
    if (!instance) return res.status(404).json({ message: 'Events instance not found' });

    const result = await CommunityEvent.deleteOne({
      _id: req.params.eventId,
      community: fresh._id,
      appInstanceId: instanceId,
    });
    if (!result.deletedCount) return res.status(404).json({ message: 'Event not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/posts
// @desc    Получить посты сообщества (до GET /:handle — порядок маршрутов)
// @access  Public
router.get('/:handle/posts', auth, async (req, res) => {
  try {
    const community = await Community.findOne({ handle: req.params.handle.toLowerCase() });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!canViewCommunity(community, req.userId)) {
      return res.status(403).json({
        message: 'This is a private community. Join to view posts.',
        code: 'PRIVATE_COMMUNITY',
      });
    }

    const Post = require('../models/Post');
    // В сообществе показываем ВСЕ посты (и публичные, и приватные)
    const posts = await Post.find({ community: community._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const { serializeFeedPost } = require('../services/postSerialize');
    const postsWithAuthors = await Promise.all(
      posts.map((post) => serializeFeedPost(post, req.userId)),
    );

    res.json(postsWithAuthors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/members
// @desc    List community members (owner only)
// @access  Private
router.get('/:handle/members', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle }).populate('owner', 'username fullName avatar email createdAt');
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!communityAdmin.hasAdminPermission(community, req.userId, 'canManageMembers')) {
      return res.status(403).json({ message: 'You do not have permission to view members' });
    }

    await ensureMemberJoins(community);
    const freshCommunity = await Community.findOne({ handle });

    const ownerId = ownerIdString(freshCommunity);
    const adminIdSet = new Set(
      (freshCommunity.admins || []).map((a) => communityAdmin.adminUserId(a)).filter(Boolean)
    );
    const memberIdSet = new Set(freshCommunity.members.map((m) => m.toString()));
    if (ownerId) memberIdSet.add(ownerId);

    const users = await User.find({ _id: { $in: [...memberIdSet] } }).select(
      'username fullName email avatar createdAt lastSeen'
    );

    const rows = users.map((u) => {
      const id = u._id.toString();
      const isOwner = id === ownerId;
      const role = isOwner ? 'Owner' : adminIdSet.has(id) ? 'Admin' : 'Member';
      return {
        id,
        username: u.username,
        fullName: u.fullName || '',
        email: u.email || '',
        avatar: u.avatar || '',
        status: 'Joined',
        role,
        joinedAt: getMemberJoinedAt(freshCommunity, id),
        lastAccessedAt: u.lastSeen || u.updatedAt || u.createdAt,
        totalSpend: 0,
      };
    });

    const roleOrder = { Owner: 0, Admin: 1, Member: 2 };
    rows.sort((a, b) => {
      const ra = roleOrder[a.role] ?? 9;
      const rb = roleOrder[b.role] ?? 9;
      if (ra !== rb) return ra - rb;
      return String(a.username).localeCompare(String(b.username));
    });

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle/dashboard/analytics
// @desc    Owner dashboard analytics (growth, posts, memberships summary)
// @access  Private (owner)
router.get('/:handle/dashboard/analytics', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const handle = req.params.handle.toLowerCase();
    let community = await Community.findOne({ handle });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!communityAdmin.hasAdminPermission(community, req.userId, 'canViewAnalytics')) {
      return res.status(403).json({ message: 'You do not have permission to view analytics' });
    }

    await ensureMemberJoins(community);
    community = await Community.findOne({ handle });

    const DAYS = 30;
    const memberGrowth = buildDailyBuckets(DAYS);
    const postsActivity = buildDailyBuckets(DAYS);

    for (const join of community.memberJoins || []) {
      incrementBucket(memberGrowth, join.joinedAt);
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (DAYS - 1));
    since.setUTCHours(0, 0, 0, 0);

    const posts = await Post.find({
      community: community._id,
      createdAt: { $gte: since },
    })
      .select('createdAt')
      .lean();

    for (const p of posts) {
      incrementBucket(postsActivity, p.createdAt);
    }

    const postCount = await Post.countDocuments({ community: community._id });
    const apps = community.installedAppInstances || [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newMembers7d = (community.memberJoins || []).filter(
      (j) => j.joinedAt && new Date(j.joinedAt) >= sevenDaysAgo
    ).length;
    const newPosts7d = posts.filter((p) => p.createdAt && new Date(p.createdAt) >= sevenDaysAgo).length;

    const payingMembers = Math.max(0, (community.memberCount || 1) - 1);
    const estimatedRevenue =
      community.isPaid && community.price > 0 ? community.price * payingMembers : 0;

    const memberships = [
      {
        id: 'community-access',
        name: `${community.name} access`,
        type: 'community',
        price: community.isPaid ? community.price : 0,
        priceLabel:
          community.isPaid && community.price > 0
            ? `$${Number(community.price).toFixed(2)}`
            : 'Free',
        billing: community.isPaid ? 'One-time' : 'Free',
        status: community.isPublic === false ? 'Private' : 'Active',
        activeUsers: community.memberCount || 0,
        allTimeRevenue: estimatedRevenue,
      },
    ];

    for (const inst of apps) {
      memberships.push({
        id: inst.id,
        name: inst.title || inst.appId,
        type: 'app',
        appId: inst.appId,
        price: 0,
        priceLabel: 'Free',
        billing: 'Included',
        status: inst.visibleToMembers === false ? 'Hidden' : 'Active',
        activeUsers: community.memberCount || 0,
        allTimeRevenue: 0,
      });
    }

    let totalChatUnread = 0;
    await migrateLegacyInstances(community);
    const fresh = await Community.findOne({ handle });
    const chatInstances = (fresh.installedAppInstances || []).filter((i) => i.appId === 'chat');
    const viewerOid = new mongoose.Types.ObjectId(req.userId);
    for (const inst of chatInstances) {
      const state = await CommunityChatReadState.findOne({
        user: req.userId,
        community: fresh._id,
        chatInstanceId: inst.id,
      }).lean();
      const cursor = state?.lastReadMessageId;
      const base = { community: fresh._id, chatInstanceId: inst.id, author: { $ne: viewerOid } };
      let n;
      if (!cursor) {
        n = await CommunityChatMessage.countDocuments(base);
      } else {
        n = await CommunityChatMessage.countDocuments({ ...base, _id: { $gt: cursor } });
      }
      totalChatUnread += n;
    }

    const periodStart = memberGrowth[0]?.date;
    const joinsBeforePeriod = (community.memberJoins || []).filter((j) => {
      if (!j.joinedAt || !periodStart) return false;
      return new Date(j.joinedAt).toISOString().slice(0, 10) < periodStart;
    }).length;
    let cumulative = joinsBeforePeriod;
    const memberGrowthCumulative = memberGrowth.map((row) => {
      cumulative += row.count;
      return { date: row.date, count: row.count, total: cumulative };
    });

    res.json({
      summary: {
        memberCount: community.memberCount || 0,
        postCount,
        appCount: apps.length,
        totalChatUnread,
        estimatedRevenue,
        newMembers7d,
        newPosts7d,
        isPaid: Boolean(community.isPaid),
        price: community.price || 0,
      },
      memberGrowth,
      memberGrowthCumulative,
      postsActivity,
      memberships,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/communities/:handle/admin-permissions
// @desc    Configure what community admins are allowed to do (owner only)
// @access  Private
router.patch('/:handle/admin-permissions', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can update admin permissions' });
    }
    const keys = Object.keys(communityAdmin.DEFAULT_ADMIN_PERMISSIONS);
    for (const key of keys) {
      if (typeof req.body[key] === 'boolean') {
        community.adminPermissions[key] = req.body[key];
      }
    }
    community.markModified('adminPermissions');
    await community.save();
    const updated = await loadCommunityWithAdmins(handle);
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/admins
// @desc    Add a community admin (owner only; user must be a member)
// @access  Private
router.post('/:handle/admins', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can add admins' });
    }
    const targetUserId = req.body?.userId != null ? String(req.body.userId).trim() : '';
    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ message: 'Valid userId is required' });
    }
    const ownerId = ownerIdString(community);
    if (targetUserId === ownerId) {
      return res.status(400).json({ message: 'The owner cannot be added as an admin' });
    }
    if (!isCommunityMember(community, targetUserId)) {
      return res.status(400).json({ message: 'User must be a community member first' });
    }
    if (communityAdmin.isCommunityAdmin(community, targetUserId)) {
      return res.status(400).json({ message: 'User is already an admin' });
    }
    community.admins.push({
      user: targetUserId,
      addedBy: req.userId,
      addedAt: new Date(),
    });
    await community.save();
    const updated = await loadCommunityWithAdmins(handle);
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/communities/:handle/admins/:userId
// @desc    Remove a community admin (owner only)
// @access  Private
router.delete('/:handle/admins/:userId', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const handle = req.params.handle.toLowerCase();
    const community = await Community.findOne({ handle });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    if (!isCommunityOwner(community, req.userId)) {
      return res.status(403).json({ message: 'Only the owner can remove admins' });
    }
    const removeId = String(req.params.userId);
    const before = community.admins.length;
    community.admins = community.admins.filter((a) => communityAdmin.adminUserId(a) !== removeId);
    if (community.admins.length === before) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await community.save();
    const updated = await loadCommunityWithAdmins(handle);
    res.json(serializeCommunityDoc(updated, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/communities/:handle
// @desc    Получить сообщество по handle (видимые экземпляры приложений зависят от роли)
// @access  Public (+ optional Bearer для фильтра приватных приложений)
router.get('/:handle', auth, async (req, res) => {
  try {
    const community = await Community.findOne({ handle: req.params.handle.toLowerCase() })
      .populate('owner', 'username fullName avatar')
      .populate('admins.user', 'username fullName avatar');

    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    await migrateLegacyInstances(community);
    const fresh = await loadCommunityWithAdmins(req.params.handle);
    if (!canViewCommunity(fresh, req.userId)) {
      return res.status(403).json({
        message: 'This is a private community. Join to access content.',
        code: 'PRIVATE_COMMUNITY',
        preview: communityAccessPreview(fresh),
      });
    }
    res.json(serializeCommunityDoc(fresh, req.userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/join
// @desc    Вступить в сообщество
// @access  Private
router.post('/:handle/join', auth, async (req, res) => {
  try {
    const community = await Community.findOne({ handle: req.params.handle.toLowerCase() });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const uid = String(req.userId);
    if (community.members.some((m) => m.toString() === uid)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    if (!verifyJoinCode(community, req.body.joinCode)) {
      return res.status(403).json({
        message: 'Invalid join code',
        code: 'INVALID_JOIN_CODE',
      });
    }

    community.members.push(req.userId);
    community.memberCount = community.members.length;
    recordMemberJoin(community, req.userId);
    community.markModified('memberJoins');
    await community.save();

    await User.findByIdAndUpdate(req.userId, {
      $push: { joinedCommunities: community._id }
    });

    res.json({ message: 'Joined successfully', memberCount: community.memberCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/communities/:handle/leave
// @desc    Выйти из сообщества
// @access  Private
router.post('/:handle/leave', auth, async (req, res) => {
  try {
    const community = await Community.findOne({ handle: req.params.handle.toLowerCase() });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const memberIndex = community.members.indexOf(req.userId);
    if (memberIndex === -1) {
      return res.status(400).json({ message: 'Not a member' });
    }

    community.members.splice(memberIndex, 1);
    community.memberCount = community.members.length;
    await community.save();

    await User.findByIdAndUpdate(req.userId, {
      $pull: { joinedCommunities: community._id }
    });

    res.json({ message: 'Left successfully', memberCount: community.memberCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;