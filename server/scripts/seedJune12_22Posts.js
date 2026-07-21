/**
 * Seed ~2000 постов за 12–22.06.2026 (до 10:30)
 * Упор: CTA в сообщества, минимум реакций
 * 
 * Usage (from server/):
 *   npm run seed:june12-22          — insert missing
 *   npm run seed:june12-22 -- --force — удалить и пересоздать
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');
const { generateJune12_22Posts, DAY_QUOTAS, NEW_USERS, ALL_USERNAMES, COMMUNITIES } = require('./generateJune12_22Posts');

const SEED_PASSWORD = 'SeedDemo2024!';

// Допустимые категории из модели Community
const VALID_CATEGORIES = ['Memecoins', 'Futures', 'On-Chain', 'Airdrops', 'Education', 'DeFi', 'NFT', 'Other'];

function parsePublishedAt(value) {
  const [datePart, timePart] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function rangeJune12_22() {
  const start = new Date(2026, 5, 12, 0, 0, 0, 0);
  const end = new Date(2026, 5, 22, 10, 30, 0, 0);
  return { start, end };
}

function buildComments(specComments, userMap) {
  if (!specComments?.length) return [];
  return specComments
    .map((c) => {
      const author = userMap.get(c.by);
      if (!author) return null;
      const createdAt = parsePublishedAt(c.publishedAt);
      return {
        user: author._id.toString(),
        content: c.text,
        likes: [],
        likesCount: 0,
        createdAt,
      };
    })
    .filter(Boolean);
}

function buildEngagementIds(userMap, authorId, count) {
  const author = String(authorId);
  const out = [];
  const pool = [...userMap.values()]
    .map((u) => u._id.toString())
    .filter((id) => id !== author);
  let i = 0;
  while (out.length < count && pool.length > 0) {
    out.push(pool[i % pool.length]);
    i += 1;
  }
  return out.slice(0, count);
}

async function ensureUser(def) {
  let user = await User.findOne({ username: def.username });
  if (user) return user;

  user = new User({
    username: def.username,
    email: def.email || `${def.username}@mail.ru`,
    password: SEED_PASSWORD,
    fullName: def.fullName || def.username,
    bio: def.bio || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(def.fullName || def.username)}&background=111827&color=fff&size=128&bold=true`,
  });
  await user.save();
  return user;
}

async function ensureAllUsers(userMap) {
  console.log(`  Создаю ${NEW_USERS.length} новых пользователей...`);
  let created = 0;
  
  for (const def of NEW_USERS) {
    if (userMap.has(def.username)) continue;
    let user = await User.findOne({ username: def.username });
    if (!user) {
      user = await ensureUser(def);
      created++;
      if (created % 100 === 0) {
        console.log(`    Создано ${created}/${NEW_USERS.length} пользователей`);
      }
    }
    userMap.set(def.username, user);
  }

  for (const username of ALL_USERNAMES) {
    if (userMap.has(username)) continue;
    let user = await User.findOne({ username });
    if (!user) {
      user = await User.findOne({ email: `${username}@mail.ru` });
    }
    if (!user) {
      const fullName = username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      user = await ensureUser({
        username,
        email: `${username}@mail.ru`,
        fullName,
        bio: `Crypto enthusiast | ${fullName}`,
      });
    }
    userMap.set(username, user);
  }
  
  console.log(`  ✅ Всего пользователей: ${userMap.size}`);
}

async function ensureCommunities() {
  const results = [];
  for (const def of COMMUNITIES) {
    let community = await Community.findOne({ handle: def.handle });
    
    if (!community) {
      const ownerUsername = ALL_USERNAMES[Math.floor(Math.random() * ALL_USERNAMES.length)];
      let owner = await User.findOne({ username: ownerUsername });
      
      if (!owner) {
        owner = await ensureUser({
          username: ownerUsername,
          email: `${ownerUsername}@mail.ru`,
          fullName: ownerUsername.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          bio: 'Crypto community owner',
        });
      }
      
      const categoryMap = {
        'whale-lounge': 'Other',
        'quant-alpha': 'Futures',
        'defi-vault': 'DeFi',
        'rwa-investors': 'DeFi',
        'options-den': 'Futures',
        'zk-ecosystem': 'Education',
        'solana-elite': 'NFT',
        'macro-circle': 'Education',
        'memecoin-lab': 'Memecoins',
        'trading-floor': 'Futures',
        'onchain-radar': 'On-Chain',
        'yield-masters': 'DeFi',
        'perp-academy': 'Futures',
        'btc-macro-desk': 'Education',
        'defi-perps-hub': 'DeFi',
      };
      
      const category = categoryMap[def.handle] || 'Other';
      
      community = new Community({
        name: def.name,
        handle: def.handle,
        description: def.description,
        category: category,
        isPublic: false,
        owner: owner._id,
        memberCount: Math.floor(Math.random() * 50) + 10,
        members: [owner._id],
        memberJoins: [{ userId: owner._id, joinedAt: new Date() }],
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      });
      
      await community.save();
      console.log(`  + Сообщество: ${def.name} (@${def.handle}) — 🔒 Закрытое (${category})`);
    }
    
    results.push({
      handle: def.handle,
      name: def.name,
      topic: def.topic,
      description: def.description,
    });
  }
  return results;
}

async function createPost(authorId, spec, userMap) {
  const createdAt = parsePublishedAt(spec.publishedAt);
  const commentDocs = buildComments(spec.comments, userMap);
  const commentsCount = commentDocs.length;
  const likes = buildEngagementIds(userMap, authorId, spec.likes ?? 0);
  const reposts = buildEngagementIds(userMap, authorId, spec.reposts ?? 0);

  const post = new Post({
    author: authorId.toString(),
    content: spec.content,
    linkAttachment: spec.linkAttachment,
    media: [],
    likes,
    likesCount: likes.length,
    reposts,
    repostsCount: reposts.length,
    comments: commentDocs,
    commentsCount,
    viewsCount: Math.max(3, Math.floor((spec.likes ?? 0) * 1.5 + commentsCount + 2)),
    isPrivate: false,
    community: null,
  });

  post.createdAt = createdAt;
  post.updatedAt = createdAt;
  await post.save({ timestamps: false });
}

async function clearRangePosts(seedAuthorIds) {
  const { start, end } = rangeJune12_22();
  const result = await Post.deleteMany({
    author: { $in: seedAuthorIds },
    createdAt: { $gte: start, $lt: end },
  });
  console.log(`  Удалено ${result.deletedCount} постов за 12–22.06.2026 (до 10:30)`);
}

async function main() {
  const force = process.argv.includes('--force');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI не указан в server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Подключено к MongoDB');
  console.log(`📅 Дни: ${DAY_QUOTAS.map(d => `${d.date} → ${d.count}`).join(', ')}`);
  console.log(`📊 Всего постов по плану: ${DAY_QUOTAS.reduce((s, d) => s + d.count, 0)}`);

  const userMap = new Map();
  await ensureAllUsers(userMap);

  const communities = await ensureCommunities();
  console.log(`🏘️ Сообществ: ${communities.length} (все закрытые)`);

  const POSTS = generateJune12_22Posts(communities);
  console.log(`📝 Сгенерировано постов: ${POSTS.length}`);

  const seedAuthorIds = [...userMap.values()].map(u => u._id.toString());

  if (force) {
    await clearRangePosts(seedAuthorIds);
  }

  let created = 0;
  let skipped = 0;

  for (const spec of POSTS) {
    const user = userMap.get(spec.username);
    if (!user) {
      skipped += 1;
      continue;
    }

    const createdAt = parsePublishedAt(spec.publishedAt);
    const exists = await Post.findOne({
      author: user._id.toString(),
      content: spec.content,
      createdAt: {
        $gte: new Date(createdAt.getTime() - 60000),
        $lte: new Date(createdAt.getTime() + 60000),
      },
    });

    if (exists && !force) {
      skipped += 1;
      continue;
    }
    if (exists && force) {
      await Post.deleteOne({ _id: exists._id });
    }

    await createPost(user._id, spec, userMap);
    created += 1;

    if (created % 200 === 0) {
      console.log(`  Прогресс: ${created}/${POSTS.length} постов создано`);
    }
  }

  for (const user of userMap.values()) {
    const count = await Post.countDocuments({ author: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { postsCount: count });
  }

  const byDay = {};
  for (const spec of POSTS) {
    const day = spec.publishedAt.split(' ')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  }

  console.log('\n✨ Done.');
  console.log(`📝 Создано постов: ${created}`);
  console.log(`⏭️ Пропущено: ${skipped}`);
  console.log(`📅 По дням: ${JSON.stringify(byDay)}`);
  console.log(`👥 Всего пользователей: ${userMap.size}`);
  console.log(`👤 Новых пользователей: ${NEW_USERS.length}`);
  console.log(`🏘️ Сообществ: ${communities.length} (все закрытые)`);
  console.log(`🔑 Пароль: ${SEED_PASSWORD}`);
  console.log(`\nПример: ${NEW_USERS[0]?.username}@mail.ru / @${NEW_USERS[0]?.username}`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});