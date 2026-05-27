/**
 * Remove seed/promo posts attributed to @ezik_lovik (May 22–24 community CTA batch).
 * Keeps any posts that do not match promo templates.
 *
 * Usage: node scripts/deleteEzikSeedPosts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const AUTHOR_ID = '6a0c4ef8ce5f9227c400cd69';
const USERNAME = 'ezik_lovik';

const SEED_PATTERNS = [
  /^Открыл ezzzik/,
  /^Хочу больше людей в ezzzik/,
  /^Лично модерирую ezzzik/,
  /^Ищу единомышленников/,
  /^Мой клуб ezzzik/,
  /^Degen, но с правилами/,
  /^Моё сообщество ezzzik/,
  /^Анонс: в ezzzik/,
  /^CTA дня:/,
  /^AMA и Q&A/,
  /^Закрытый вайб/,
  /^Кто в i love playing/,
  /^Сегодня активность в ezzzik/,
  /^Не только пост — целое сообщество/,
  /^Sharing my community ezzzik/,
  /^Веду ezzzik/,
  /^Рекламирую ezzzik/,
  /^Запустил свежую ветку/,
  /^Делюсь апдейтами только в ezzzik/,
  /^Чеклист недели/,
  /^Новый гайд в ezzzik/,
  /^Weekly recap/,
  /^Пиннул важное в ezzzik/,
  /^Сегодня разбор в ezzzik/,
  /^Promo своего ezzzik/,
  /^В ezzzik ищем активных/,
  /^Кто ещё не в ezzzik/,
  /^Сделал ezzzik/,
  /^Моё сообщество про/,
  /^Только что обновил правила в ezzzik/,
];

function isSeedPost(content) {
  const text = String(content || '');
  return SEED_PATTERNS.some((r) => r.test(text));
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 60000 });
  const all = await Post.find({ author: AUTHOR_ID }).select('_id content');
  const toDelete = all.filter((p) => isSeedPost(p.content)).map((p) => p._id);
  const toKeep = all.filter((p) => !isSeedPost(p.content));

  console.log(`@${USERNAME}: total ${all.length}, delete ${toDelete.length}, keep ${toKeep.length}`);
  if (toKeep.length) {
    toKeep.forEach((p) => console.log('  KEEP', p._id.toString(), (p.content || '').slice(0, 100)));
  }

  if (toDelete.length === 0) {
    await mongoose.disconnect();
    return;
  }

  const result = await Post.deleteMany({ _id: { $in: toDelete } });
  const remaining = await Post.countDocuments({ author: AUTHOR_ID });
  await User.findByIdAndUpdate(AUTHOR_ID, { postsCount: remaining });

  console.log('Deleted:', result.deletedCount);
  console.log('postsCount:', remaining);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
