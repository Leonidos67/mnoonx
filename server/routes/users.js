// routes/users.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Follow = require('../models/Follow');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

async function serializePostWithAuthor(post, viewerUserId) {
  const author = await User.findById(post.author).select('username fullName avatar');
  const uid = viewerUserId ? String(viewerUserId) : null;
  return {
    _id: post._id,
    content: post.content,
    author: author
      ? {
          _id: author._id.toString(),
          username: author.username,
          fullName: author.fullName || author.username,
          avatar: author.avatar || '',
        }
      : {
          _id: post.author,
          username: 'unknown',
          fullName: 'Unknown',
          avatar: '',
        },
    media: post.media || [],
    likesCount: post.likesCount || 0,
    commentsCount: post.commentsCount || 0,
    repostsCount: post.repostsCount || 0,
    viewsCount: post.viewsCount || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    isLiked: uid ? post.likes.some((id) => String(id) === uid) : false,
    isReposted: uid ? post.reposts.some((id) => String(id) === uid) : false,
  };
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

    // Проверяем подписку
    let isFollowing = false;
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
    }

    console.log('FINAL isFollowing:', isFollowing);

    const posts = await Post.find({ author: user._id.toString() })
      .sort({ createdAt: -1 })
      .limit(50);

    const postsWithAuthor = await Promise.all(
      posts.map((post) => serializePostWithAuthor(post, req.userId))
    );

    res.json({
      ...user.toJSON(),
      isFollowing,
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
      .select('followersCount followingCount');

    console.log('Follow created! New followersCount:', updatedUser.followersCount);

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