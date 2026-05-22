// routes/posts.js
const express = require('express');
const crypto = require('crypto');
const fssync = require('fs');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
const auth = require('../middleware/auth');

const UPLOADS_ROOT = path.join(__dirname, '../uploads');
const POST_MEDIA_DIR = path.join(UPLOADS_ROOT, 'post-media');
try {
  fssync.mkdirSync(POST_MEDIA_DIR, { recursive: true });
} catch (_) {
  /* ignore */
}

const postMediaUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, POST_MEDIA_DIR);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '';
      cb(null, `${crypto.randomBytes(12).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (ok.has(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP or GIF images are allowed'));
  },
});

const MAX_POST_MEDIA = 10;

function serializeLinkAttachment(linkAttachment) {
  if (!linkAttachment?.title?.trim() || !linkAttachment?.url?.trim()) return null;
  return {
    title: String(linkAttachment.title).trim().slice(0, 120),
    url: String(linkAttachment.url).trim().slice(0, 500),
  };
}

async function parseLinkAttachmentInput(raw, userId) {
  if (!raw || typeof raw !== 'object') return null;
  const title = String(raw.title || '').trim();
  let url = String(raw.url || '').trim();
  if (!title || !url) return { error: 'Link title and URL are required' };

  if (url.startsWith('/')) {
    const match = url.match(/^\/community\/([a-z0-9_-]+)\/?$/i);
    if (!match) return { error: 'Invalid community link' };
    const handle = match[1].toLowerCase();
    const comm = await Community.findOne({ handle });
    if (!comm) return { error: 'Community not found' };
    if (!isCommunityOwner(comm, userId)) {
      return { error: 'You can only link communities you own' };
    }
    url = `/community/${handle}`;
  } else {
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { error: 'Invalid link URL' };
      }
      url = parsed.href;
    } catch {
      return { error: 'Invalid link URL' };
    }
  }

  return { title: title.slice(0, 120), url: url.slice(0, 500) };
}

function sanitizePostMediaUrls(media) {
  if (!Array.isArray(media)) return [];
  return media
    .filter((u) => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => u.startsWith('/uploads/post-media/'))
    .slice(0, MAX_POST_MEDIA);
}

function isCommunityMember(community, userId) {
  if (!userId || !community) return false;
  const uid = userId.toString();
  return community.members.some((m) => m.toString() === uid);
}

function ownerIdString(community) {
  const o = community?.owner;
  if (!o) return '';
  if (typeof o === 'object' && o._id != null) return o._id.toString();
  return o.toString();
}

function isCommunityOwner(community, userId) {
  if (!userId || !community) return false;
  const ownerId = ownerIdString(community);
  if (!ownerId) return false;
  return ownerId === userId.toString();
}

function canPostInCommunity(community, userId) {
  if (!userId || !community) return false;
  if (isCommunityOwner(community, userId)) return true;
  if (!isCommunityMember(community, userId)) return false;
  return community.membersCanPost !== false;
}

async function serializePostComments(comments) {
  const list = comments || [];
  return Promise.all(
    list.map(async (c) => {
      const author = await User.findById(c.user).select('username fullName avatar');
      return {
        _id: c._id,
        content: c.content,
        createdAt: c.createdAt,
        likesCount: c.likesCount || 0,
        user: author
          ? {
              _id: author._id.toString(),
              username: author.username,
              fullName: author.fullName || author.username,
              avatar: author.avatar || '',
            }
          : {
              _id: c.user,
              username: 'unknown',
              fullName: 'Unknown',
              avatar: '',
            },
      };
    })
  );
}

// POST /api/posts - Создать пост
router.post('/', auth, async (req, res) => {
  try {
    const { content, media, community, isPrivate, linkAttachment: linkRaw } = req.body;
    const authorId = req.userId.toString();

    console.log('\n📝 CREATE POST');
    console.log('  Content:', content?.substring(0, 50));
    console.log('  Community:', community);
    console.log('  isPrivate:', isPrivate);
    console.log('  Author ID:', authorId);

    const trimmedContent = (content || '').trim();
    const mediaList = sanitizePostMediaUrls(media);

    const linkParsed = await parseLinkAttachmentInput(linkRaw, req.userId);
    if (linkParsed?.error) {
      return res.status(400).json({ message: linkParsed.error });
    }

    if (!trimmedContent && mediaList.length === 0 && !linkParsed) {
      return res.status(400).json({ message: 'Add text, a link, or at least one image' });
    }

    if (community) {
      const comm = await Community.findById(community);
      if (!comm) {
        return res.status(404).json({ message: 'Community not found' });
      }
      if (!isCommunityMember(comm, req.userId) && !isCommunityOwner(comm, req.userId)) {
        return res.status(403).json({ message: 'Join the community to post here' });
      }
      if (!canPostInCommunity(comm, req.userId)) {
        return res.status(403).json({
          message: 'Only the community owner can post in this community',
        });
      }
    }

    const author = await User.findById(authorId).select('username fullName avatar');
    
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const post = new Post({
      author: authorId,
      content: trimmedContent,
      media: mediaList,
      community: community || null,
      isPrivate: isPrivate || false,
      linkAttachment: linkParsed || undefined,
    });

    await post.save();
    console.log('✅ Post created successfully, ID:', post._id);

    const postData = {
      _id: post._id,
      content: post.content,
      author: {
        _id: author._id.toString(),
        username: author.username,
        fullName: author.fullName || author.username,
        avatar: author.avatar || ''
      },
      media: post.media || [],
      linkAttachment: serializeLinkAttachment(post.linkAttachment),
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      viewsCount: 0,
      createdAt: post.createdAt,
      isLiked: false,
      isReposted: false,
      community: post.community,
      isPrivate: post.isPrivate
    };

    res.status(201).json(postData);
  } catch (error) {
    console.error('❌ Create post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/posts/media/upload — must be before /:id
router.post('/media/upload', auth, (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const upload = postMediaUpload.array('files', MAX_POST_MEDIA);
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    const files = req.files || [];
    if (!files.length) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const urls = files.map((f) => `/uploads/post-media/${f.filename}`);
    res.json({ urls });
  });
});

// GET /api/posts - Получить все посты для главной ленты
router.get('/', auth, async (req, res) => {
  try {
    console.log('\n🔍 GET /api/posts');
    console.log('👤 User ID:', req.userId || 'Not authenticated');
    
    // Показываем все публичные посты (isPrivate = false)
    const posts = await Post.find({ isPrivate: false })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`✅ Found ${posts.length} public posts`);

    const postsData = await Promise.all(posts.map(async (post) => {
      const author = await User.findById(post.author).select('username fullName avatar');
      
      let communityInfo = null;
      if (post.community) {
        const Community = require('../models/Community');
        const community = await Community.findById(post.community).select('name handle avatar');
        if (community) {
          communityInfo = {
            _id: community._id,
            name: community.name,
            handle: community.handle,
            avatar: community.avatar
          };
        }
      }
      
      // ВАЖНО: Проверяем лайк для текущего пользователя
      const uid = req.userId ? String(req.userId) : null;
      const isLiked = uid ? post.likes.some((id) => String(id) === uid) : false;
      const isReposted = uid ? post.reposts.some((id) => String(id) === uid) : false;
      
      console.log(`Post ${post._id}: isLiked=${isLiked}, userId=${req.userId}`);
      
      return {
        _id: post._id,
        content: post.content,
        author: author ? {
          _id: author._id.toString(),
          username: author.username,
          fullName: author.fullName || author.username,
          avatar: author.avatar || ''
        } : null,
        community: communityInfo,
        media: post.media || [],
        linkAttachment: serializeLinkAttachment(post.linkAttachment),
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        repostsCount: post.repostsCount || 0,
        viewsCount: post.viewsCount || 0,
        createdAt: post.createdAt,
        isLiked: isLiked,
        isReposted: isReposted,
        isBookmarked: uid ? post.bookmarks.some((id) => String(id) === uid) : false,
        isPrivate: post.isPrivate || false
      };
    }));

    console.log(`Returning ${postsData.length} posts with like status`);
    res.json(postsData);
  } catch (error) {
    console.error('❌ Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/posts/:id - Получить конкретный пост
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('\n🔍 GET /api/posts/:id', req.params.id);
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const author = await User.findById(post.author).select('username fullName avatar');
    
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const userId = req.userId || req.query.viewer;
    if (userId) {
      await post.addView(userId);
    }

    let communityInfo = null;
    if (post.community) {
      const Community = require('../models/Community');
      const community = await Community.findById(post.community).select('name handle avatar');
      if (community) {
        communityInfo = {
          _id: community._id,
          name: community.name,
          handle: community.handle,
          avatar: community.avatar
        };
      }
    }

    const uid = req.userId ? String(req.userId) : null;
    const comments = await serializePostComments(post.comments);
    const postData = {
      _id: post._id,
      content: post.content,
      author: {
        _id: author._id.toString(),
        username: author.username,
        fullName: author.fullName || author.username,
        avatar: author.avatar || ''
      },
      community: communityInfo,
      media: post.media || [],
      linkAttachment: serializeLinkAttachment(post.linkAttachment),
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      comments,
      repostsCount: post.repostsCount || 0,
      viewsCount: post.viewsCount || 0,
      createdAt: post.createdAt,
      isLiked: uid ? post.likes.some((id) => String(id) === uid) : false,
      isReposted: uid ? post.reposts.some((id) => String(id) === uid) : false,
      isBookmarked: uid ? post.bookmarks.some((id) => String(id) === uid) : false,
      isPrivate: post.isPrivate || false
    };

    console.log('✅ Post found, returning data');
    res.json(postData);
  } catch (error) {
    console.error('❌ Get post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/posts/:id - Обновить пост
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const userId = req.userId.toString();

    console.log('\n✏️ UPDATE POST');
    console.log('  Post ID:', postId);
    console.log('  User ID:', userId);

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    post.content = content.trim();
    await post.save();

    const author = await User.findById(userId).select('username fullName avatar');
    
    const updatedPost = {
      _id: post._id,
      content: post.content,
      author: author ? {
        _id: author._id.toString(),
        username: author.username,
        fullName: author.fullName || author.username,
        avatar: author.avatar || ''
      } : null,
      media: post.media || [],
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      repostsCount: post.repostsCount || 0,
      viewsCount: post.viewsCount || 0,
      createdAt: post.createdAt,
      isLiked: post.likes.some((id) => String(id) === userId),
      isReposted: post.reposts.some((id) => String(id) === userId),
      isPrivate: post.isPrivate || false
    };

    console.log('✅ Post updated successfully');
    res.json(updatedPost);
  } catch (error) {
    console.error('❌ Update post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function findPostComment(post, commentId) {
  if (!post?.comments?.length) return null;
  return post.comments.find((c) => String(c._id) === String(commentId)) || null;
}

// POST /api/posts/:id/comments - Добавить комментарий
router.post('/:id/comments', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.userId.toString(),
      content: String(content).trim().slice(0, 500),
    });
    post.commentsCount = post.comments.length;
    await post.save();

    const last = post.comments[post.comments.length - 1];
    const [comment] = await serializePostComments([last]);

    res.status(201).json({
      comment,
      commentsCount: post.commentsCount,
    });
  } catch (error) {
    console.error('❌ Comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/posts/:id/comments/:commentId - Редактировать комментарий
router.put('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { content } = req.body;
    if (!content || !String(content).trim()) {
      return res.status(400).json({ message: 'Comment is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = findPostComment(post, req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const uid = req.userId.toString();
    if (String(comment.user) !== uid) {
      return res.status(403).json({ message: 'Not authorized to edit this comment' });
    }

    comment.content = String(content).trim().slice(0, 500);
    post.markModified('comments');
    await post.save();

    const [serialized] = await serializePostComments([comment]);
    res.json({ comment: serialized, commentsCount: post.commentsCount });
  } catch (error) {
    console.error('❌ Edit comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id/comments/:commentId - Удалить комментарий
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = findPostComment(post, req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const uid = req.userId.toString();
    if (String(comment.user) !== uid) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    post.comments = post.comments.filter(
      (c) => String(c._id) !== String(req.params.commentId)
    );
    post.commentsCount = post.comments.length;
    await post.save();

    res.json({ commentsCount: post.commentsCount });
  } catch (error) {
    console.error('❌ Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/like - Лайкнуть/анлайкнуть пост
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const liked = await post.toggleLike(req.userId);
    console.log(`❤️ ${liked ? 'Liked' : 'Unliked'} post:`, req.params.id);
    
    res.json({ 
      liked,
      likesCount: post.likesCount
    });
  } catch (error) {
    console.error('❌ Like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/repost - Репостнуть
router.post('/:id/repost', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const uid = String(req.userId);
    const index = post.reposts.findIndex((id) => String(id) === uid);
    if (index === -1) {
      post.reposts.push(uid);
      post.repostsCount = post.reposts.length;
    } else {
      post.reposts.splice(index, 1);
      post.repostsCount = post.reposts.length;
    }
    
    await post.save();

    console.log(`🔄 ${index === -1 ? 'Reposted' : 'Unreposted'} post:`, req.params.id);

    res.json({ 
      reposted: index === -1,
      repostsCount: post.repostsCount
    });
  } catch (error) {
    console.error('❌ Repost error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/bookmark - В закладки
router.post('/:id/bookmark', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const uid = String(req.userId);
    const index = post.bookmarks.findIndex((id) => String(id) === uid);
    if (index === -1) {
      post.bookmarks.push(uid);
    } else {
      post.bookmarks.splice(index, 1);
    }
    post.bookmarksCount = post.bookmarks.length;
    await post.save();

    console.log(`🔖 ${index === -1 ? 'Bookmarked' : 'Unbookmarked'} post:`, req.params.id);

    res.json({ 
      bookmarked: index === -1,
      bookmarksCount: post.bookmarksCount
    });
  } catch (error) {
    console.error('❌ Bookmark error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/posts/:id - Удалить пост
router.delete('/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId.toString();

    console.log('\n🗑️ DELETE POST');
    console.log('  Post ID:', postId);
    console.log('  User ID:', userId);

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(postId);

    await User.findByIdAndUpdate(userId, {
      $inc: { postsCount: -1 }
    });

    console.log('✅ Post deleted successfully');

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('❌ Delete post error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;