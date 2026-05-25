/**
 * 480 community promo posts for 22–24.05.2026 — CTA join / visit.
 * Used by seedMay22_24Posts.js
 */

const { COMMUNITIES: DEFAULT_COMMUNITIES } = require('./generateMay21Posts');

const USERNAME_POOL = [
  'cryptoalpha', 'solwhale_io', 'defi_chad', 'btc_oracle_ru', 'memecoin_hunter',
  'chainscout', 'altseason_io', 'onchain_anna', 'perp_master', 'web3_daily',
  'eth_maxi', 'layer2_lisa', 'macro_mike', 'sol_degen_ru', 'funding_watcher',
  'stable_sage', 'nft_flipper', 'base_builder', 'riven_trades', 'orbit_eth',
  'nova_macro_ru', 'airdrop_ace', 'restaking_ray', 'pepe_signals', 'arb_alex',
  'yield_yuki', 'volkov_trade', 'katya_onchain', 'miner_x_ru', 'luna_defi_ru',
  'chart_master_ru',
];

/** Разное количество по дням (сумма = 480) */
const DAY_QUOTAS = [
  { date: '22.05.2026', count: 136 },
  { date: '23.05.2026', count: 164 },
  { date: '24.05.2026', count: 180 },
];

const PROMO_TEMPLATES = [
  'Веду {name} — заходи и вступай, если по теме {topic}. Без спама, живые треды.',
  'Моё сообщество {name}: открыл доступ, welcome новичкам. Обсуждаем {topic}.',
  'Рекламирую {name} — лучшее место по {topic} на платформе. Жми Join.',
  'Сегодня активность в {name}. Вступай, если хочешь разборы и чат без токсичности.',
  'Запустил свежую ветку в {name}. Тема: {topic}. Ссылка — вступить в клуб.',
  'Кто в {topic} — приглашаю в {name}. Код/Join в профиле сообщества.',
  'Делюсь апдейтами только в {name}. Заходи, если ещё не внутри.',
  'AMA и Q&A сегодня в {name}. Вступление открыто — заходи.',
  'Чеклист недели выложил в {name}. Join → лента сообщества.',
  'Ищу единомышленников в {topic} — моё пространство {name}.',
  'Новый гайд в {name}. Коротко по {topic}. Вступай и читай в ленте.',
  'Degen, но с правилами — это {name}. Заходи в сообщество.',
  'Weekly recap уже в {name}. Не в ленте — внутри клуба. Join.',
  'Открыл {name} для обсуждения {topic}. Буду рад видеть в members.',
  'Пиннул важное в {name} — зайди через Join, если пропустил.',
  'Мой клуб {name}: {topic}, мемы и risk notes. Вступай.',
  'Сегодня разбор в {name}. Нужен доступ? Join — и ты внутри.',
  'Sharing my community {name} — join if you care about {topic}.',
  'Promo своего {name}: вечером тред в чате. Вступай заранее.',
  'Не только пост — целое сообщество {name}. Заходи, обсуждаем {topic}.',
  'В {name} ищем активных участников. Тема {topic}. Ссылка ниже — вступить.',
  'Закрытый вайб, но вход открыт: {name}. Join и забирай пользу по {topic}.',
  'Кто ещё не в {name} — самое время. Обновления по {topic} там.',
  'Лично модерирую {name}. Заходи, если хочешь качественный чат про {topic}.',
  'Сделал {name} для тех, кто устал от шума. Вступай — спокойно по {topic}.',
  'Анонс: в {name} стартует серия постов. Join сейчас — не потеряешь.',
  'Моё сообщество про {topic} — {name}. Кнопка Join, не лайк.',
  'Хочу больше людей в {name}. Если {topic} твоя тема — вступай.',
  'Только что обновил правила в {name}. Заходи и вступай, если по пути.',
  'CTA дня: зайти в {name}, вступить, прочитать пин. {topic} inside.',
];

const LINK_TITLES = [
  'Вступить в {name}',
  'Зайти в {name}',
  'Join {name}',
  '{name} — сообщество',
  'Открыть {name}',
  'Перейти в {name}',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTime() {
  const h = 6 + Math.floor(Math.random() * 18);
  const m = Math.floor(Math.random() * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fill(text, community) {
  return text
    .replace(/\{name\}/g, community.name)
    .replace(/\{handle\}/g, community.handle)
    .replace(/\{topic\}/g, community.topic || 'крипто');
}

function communityLink(community, title) {
  return {
    title: fill(title || community.name, community).slice(0, 120),
    url: `/community/${community.handle}`,
  };
}

function smallEngagement() {
  const likes = Math.floor(Math.random() * 10);
  const reposts = Math.random() > 0.9 ? 1 + Math.floor(Math.random() * 2) : 0;
  let comments;
  if (Math.random() > 0.92) {
    comments = [
      {
        by: pick(USERNAME_POOL),
        text: pick([
          'Зашёл, спасибо за инвайт.',
          'Joined, see you inside.',
          'Уже внутри, огонь.',
          'Вступил, где пин?',
          'Полезно, остаюсь в клубе.',
        ]),
        publishedAt: '',
      },
    ];
  } else {
    comments = undefined;
  }
  return { likes, reposts, comments };
}

/**
 * @param {Array<{ handle: string; name: string; topic?: string; ownerUsername?: string }>} communities
 * @returns {Array<{ username: string; publishedAt: string; content: string; linkAttachment: object; likes: number; reposts: number; comments?: object[] }>}
 */
function generateMay22_24Posts(communitiesInput) {
  const communities =
    communitiesInput?.length > 0
      ? communitiesInput.map((c) => ({
          handle: c.handle,
          name: c.name,
          topic: c.topic || 'крипто',
          ownerUsername: c.ownerUsername || null,
        }))
      : DEFAULT_COMMUNITIES.map((c) => ({ ...c, ownerUsername: null }));

  const posts = [];
  const used = new Set();
  let globalIdx = 0;

  for (const day of DAY_QUOTAS) {
    for (let n = 0; n < day.count; n++) {
      const community = communities[globalIdx % communities.length];
      const ownerUsername =
        community.ownerUsername || USERNAME_POOL[globalIdx % USERNAME_POOL.length];
      const tpl = PROMO_TEMPLATES[globalIdx % PROMO_TEMPLATES.length];
      let content = fill(tpl, community);
      const linkAttachment = communityLink(
        community,
        fill(pick(LINK_TITLES), community)
      );

      const key = `${day.date}||${content}||${linkAttachment.url}`;
      if (used.has(key)) {
        content = `${content} (${globalIdx + 1})`;
      }
      used.add(key);

      const eng = smallEngagement();
      const spec = {
        username: ownerUsername,
        publishedAt: `${day.date} ${randomTime()}`,
        content,
        linkAttachment,
        likes: eng.likes,
        reposts: eng.reposts,
      };
      if (eng.comments?.length) {
        spec.comments = eng.comments.map((c) => ({
          ...c,
          publishedAt: `${day.date} ${randomTime()}`,
        }));
      }
      posts.push(spec);
      globalIdx += 1;
    }
  }

  return posts;
}

module.exports = {
  generateMay22_24Posts,
  DAY_QUOTAS,
  USERNAME_POOL,
  DEFAULT_COMMUNITIES,
};
