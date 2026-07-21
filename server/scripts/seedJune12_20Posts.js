/**
 * Seed ~800 постов за 12–20.06.2026
 * 
 * Usage (from server/):
 *   npm run seed:june12-20          — insert missing
 *   npm run seed:june12-20 -- --force — удалить старые посты в этом диапазоне и пересоздать
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');
const { generateJune12_20Posts, DAY_QUOTAS, NEW_USERS, ALL_USERNAMES, NEW_COMMUNITIES } = require('./generateJune12_20Posts');

const SEED_PASSWORD = 'SeedDemo2024!';

// Допустимые категории из модели Community
const VALID_CATEGORIES = ['Memecoins', 'Futures', 'On-Chain', 'Airdrops', 'Education', 'DeFi', 'NFT', 'Other'];

function parsePublishedAt(value) {
  const [datePart, timePart] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function rangeJune12_20() {
  const start = new Date(2026, 5, 18, 0, 0, 0, 0);
  const end = new Date(2026, 5, 22, 0, 0, 0, 0);
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
  console.log(`  + Новый юзер @${def.username} (${def.fullName})`);
  return user;
}

async function ensureAllUsers(userMap) {
  for (const def of NEW_USERS) {
    if (userMap.has(def.username)) continue;
    let user = await User.findOne({ username: def.username });
    if (!user) {
      user = await ensureUser(def);
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
}

async function ensureClosedCommunities() {
  const results = [];
  for (const def of NEW_COMMUNITIES) {
    let community = await Community.findOne({ handle: def.handle });
    
    if (!community) {
      // Находим существующего пользователя для owner (обязательно)
      const ownerUsername = ALL_USERNAMES[Math.floor(Math.random() * ALL_USERNAMES.length)];
      let owner = await User.findOne({ username: ownerUsername });
      
      // Если не нашли, создаем
      if (!owner) {
        owner = await ensureUser({
          username: ownerUsername,
          email: `${ownerUsername}@mail.ru`,
          fullName: ownerUsername.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          bio: 'Crypto community owner',
        });
      }
      
      // Используем допустимую категорию из модели
      const categoryMap = {
        'whale-lounge': 'Other',
        'quant-alpha': 'Futures',
        'defi-vault': 'DeFi',
        'rwa-investors': 'DeFi',
        'options-den': 'Futures',
        'zk-ecosystem': 'Education',
        'solana-elite': 'NFT',
        'macro-circle': 'Education',
      };
      
      const category = categoryMap[def.handle] || 'Other';
      
      community = new Community({
        name: def.name,
        handle: def.handle,
        description: def.description,
        category: category,
        isPublic: !(def.isPrivate || true), // isPublic = true если открытое
        owner: owner._id, // owner обязателен!
        memberCount: Math.floor(Math.random() * 50) + 10,
        members: [owner._id],
        memberJoins: [{ userId: owner._id, joinedAt: new Date() }],
        // Для приватных сообществ добавляем joinCode
        joinCode: def.isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : '',
      });
      
      await community.save();
      console.log(`  + Сообщество: ${def.name} (@${def.handle}) — ${def.isPrivate ? '🔒 Закрытое' : '🌐 Открытое'} (категория: ${category})`);
    } else {
      // Обновляем существующее если нужно
      if (def.isPrivate && community.isPublic) {
        community.isPublic = false;
        community.joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await community.save();
        console.log(`  🔒 Обновлено: ${def.name} (@${def.handle}) — теперь закрытое`);
      }
    }
    
    results.push({
      handle: def.handle,
      name: def.name,
      topic: def.topic,
      category: def.category || community?.category || 'Other',
      description: def.description,
      isPrivate: def.isPrivate,
    });
  }
  return results;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
    viewsCount: Math.max(5, Math.floor((spec.likes ?? 0) * 2 + commentsCount + 3)),
    isPrivate: false,
    community: null,
  });

  post.createdAt = createdAt;
  post.updatedAt = createdAt;
  await post.save({ timestamps: false });
}

async function clearRangePosts(seedAuthorIds) {
  const { start, end } = rangeJune12_20();
  const result = await Post.deleteMany({
    author: { $in: seedAuthorIds },
    createdAt: { $gte: start, $lt: end },
  });
  console.log(`  Удалено ${result.deletedCount} постов за 12–20.06.2026 (сидовые авторы)`);
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

  const communities = await ensureClosedCommunities();
  console.log(`🏘️ Создано/обновлено сообществ: ${communities.length}`);

  const POSTS = generateJune12_20Posts(communities);
  console.log(`📝 Сгенерировано постов: ${POSTS.length}`);

  const userMap = new Map();
  await ensureAllUsers(userMap);
  console.log(`👥 Задействовано юзеров: ${userMap.size}`);

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

    if (created % 100 === 0) {
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
  console.log(`👥 Новых юзеров добавлено: ${NEW_USERS.length}`);
  console.log(`🔒 Закрытых сообществ: ${communities.length}`);
  console.log(`🔑 Пароль для всех сидов: ${SEED_PASSWORD}`);
  console.log(`\nПример юзера: ${NEW_USERS[0]?.username}@mail.ru / @${NEW_USERS[0]?.username}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});