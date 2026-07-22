/**
 * Bot-friendly Open Graph HTML for profile / post / community share links.
 * SPA crawlers that don't execute JS get these meta tags.
 */
const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');

const router = express.Router();

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ogPage({ title, description, image, url, type = 'website' }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(image || '');
  const u = escapeHtml(url);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${t}</title>
  <meta name="description" content="${d}" />
  <meta property="og:type" content="${escapeHtml(type)}" />
  <meta property="og:title" content="${t}" />
  <meta property="og:description" content="${d}" />
  <meta property="og:url" content="${u}" />
  ${i ? `<meta property="og:image" content="${i}" />` : ''}
  <meta name="twitter:card" content="${i ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${t}" />
  <meta name="twitter:description" content="${d}" />
  ${i ? `<meta name="twitter:image" content="${i}" />` : ''}
  <meta http-equiv="refresh" content="0;url=${u}" />
  <link rel="canonical" href="${u}" />
</head>
<body>
  <p><a href="${u}">${t}</a></p>
  <p>${d}</p>
</body>
</html>`;
}

function clientBase(req) {
  return (process.env.CLIENT_ORIGIN || 'http://localhost:3000').split(',')[0].trim();
}

function absUrl(req, pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).lean();
    if (!user) return res.status(404).send('Not found');
    const base = clientBase(req);
    const url = `${base}/@${user.username}`;
    const html = ogPage({
      title: `${user.fullName || user.username} (@${user.username}) · MNOONX`,
      description: user.bio || `Profile of @${user.username} on MNOONX`,
      image: absUrl(req, user.avatar || user.banner),
      url,
      type: 'profile',
    });
    res.type('html').send(html);
  } catch (error) {
    console.error('OG profile error:', error);
    res.status(500).send('Error');
  }
});

router.get('/post/:postId', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).lean();
    if (!post) return res.status(404).send('Not found');
    const author = await User.findById(post.author).select('username fullName avatar').lean();
    const base = clientBase(req);
    const url = `${base}/post/${post._id}`;
    const html = ogPage({
      title: author
        ? `Post by @${author.username} · MNOONX`
        : 'Post · MNOONX',
      description: String(post.content || '').slice(0, 200),
      image: absUrl(req, (post.media && post.media[0]) || author?.avatar || ''),
      url,
      type: 'article',
    });
    res.type('html').send(html);
  } catch (error) {
    console.error('OG post error:', error);
    res.status(500).send('Error');
  }
});

router.get('/community/:handle', async (req, res) => {
  try {
    const community = await Community.findOne({ handle: req.params.handle }).lean();
    if (!community) return res.status(404).send('Not found');
    const base = clientBase(req);
    const url = `${base}/community/${community.handle}`;
    const html = ogPage({
      title: `${community.name} · MNOONX`,
      description: community.description || `Community ${community.name} on MNOONX`,
      image: absUrl(req, community.avatar || community.banner || ''),
      url,
    });
    res.type('html').send(html);
  } catch (error) {
    console.error('OG community error:', error);
    res.status(500).send('Error');
  }
});

module.exports = router;
