/**
 * Seed ~1000 постов за 25.05–11.06.2026
 * 
 * Usage (from server/):
 *   npm run seed:may25-june11          — insert missing
 *   npm run seed:may25-june11 -- --force — удалить старые посты в этом диапазоне и пересоздать
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Community = require('../models/Community');
const { generateMay25_June11Posts, DAY_QUOTAS, NEW_USERS, ALL_USERNAMES } = require('./generateMay25_June11Posts');

const SEED_PASSWORD = 'SeedDemo2024!';

function parsePublishedAt(value) {
  const [datePart, timePart] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function rangeMay25_June11() {
  const start = new Date(2026, 4, 25, 0, 0, 0, 0); // 25 мая
  const end = new Date(2026, 5, 12, 0, 0, 0, 0);   // 12 июня (не включая)
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
    email: def.email || `${def.username}@seed.mnoonx.dev`,
    password: SEED_PASSWORD,
    fullName: def.fullName || def.username,
    bio: def.bio || '',
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(def.fullName || def.username)}&background=111827&color=fff&size=128&bold=true`,
  });
  await user.save();
  console.log(`  + НОВЫЙ юзер @${def.username} (${def.fullName})`);
  return user;
}

async function ensureAllUsers(userMap) {
  // Добавляем ВСЕХ существующих юзеров (из EXISTING_USERS + NEW_USERS)
  const allUserDefs = [...NEW_USERS];
  
  // Для существующих юзеров, которых нет в NEW_USERS, проверяем через БД
  for (const username of ALL_USERNAMES) {
    if (userMap.has(username)) continue;
    
    let user = await User.findOne({ username });
    if (!user) {
      // Проверяем существует ли такой юзер в принципе (возможно, создан ранее)
      user = await User.findOne({ email: `${username}@seed.mnoonx.dev` });
    }
    
    if (!user) {
      // Если юзера нет — создаем с базовыми данными
      const fullName = username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      user = await ensureUser({
        username,
        email: `${username}@seed.mnoonx.dev`,
        fullName,
        bio: `Crypto enthusiast | ${fullName}`,
      });
    }
    userMap.set(username, user);
  }
}

async function loadCommunities() {
  const docs = await Community.find()
    .select('name handle description category owner')
    .populate('owner', 'username')
    .lean();

  if (docs.length === 0) {
    console.log('  Нет сообществ в БД — используем дефолтные');
    const { DEFAULT_COMMUNITIES } = require('./generateMay21Posts');
    return DEFAULT_COMMUNITIES.map((c) => ({
      handle: c.handle,
      name: c.name,
      topic: c.topic,
      description: c.description,
    }));
  }

  return docs.map((c) => ({
    handle: c.handle,
    name: c.name,
    topic: c.description?.slice(0, 80) || c.category || 'крипто',
    description: c.description,
  }));
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
  const { start, end } = rangeMay25_June11();
  const result = await Post.deleteMany({
    author: { $in: seedAuthorIds },
    createdAt: { $gte: start, $lt: end },
  });
  console.log(`  Удалено ${result.deletedCount} постов за 25.05–11.06.2026 (сидовые авторы)`);
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

  const communities = await loadCommunities();
  console.log(`🏘️ Сообществ загружено: ${communities.length}`);

  const POSTS = generateMay25_June11Posts(communities);
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

  // Обновляем postsCount у юзеров
  for (const user of userMap.values()) {
    const count = await Post.countDocuments({ author: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { postsCount: count });
  }

  // Статистика по дням
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
  console.log(`🔑 Пароль для всех сидов: ${SEED_PASSWORD}`);
  console.log(`\nПример юзера: ${NEW_USERS[0]?.username}@seed.mnoonx.dev / @${NEW_USERS[0]?.username}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});