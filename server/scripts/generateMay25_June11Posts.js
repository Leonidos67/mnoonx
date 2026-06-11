/**
 * ~1000 постов за 25.05–11.06.2026
 * Темы: аналитика, мемы, фундаментал, CTA в сообщества, портфельные обновления
 */

const { COMMUNITIES: DEFAULT_COMMUNITIES } = require('./generateMay21Posts');

// ========== ПОЛЬЗОВАТЕЛИ (старые + НОВЫЕ) ==========
const EXISTING_USERS = [
  'cryptoalpha', 'solwhale_io', 'defi_chad', 'btc_oracle_ru', 'memecoin_hunter',
  'chainscout', 'altseason_io', 'onchain_anna', 'perp_master', 'web3_daily',
  'eth_maxi', 'layer2_lisa', 'macro_mike', 'sol_degen_ru', 'funding_watcher',
  'stable_sage', 'nft_flipper', 'base_builder', 'riven_trades', 'orbit_eth',
  'nova_macro_ru', 'airdrop_ace', 'restaking_ray', 'pepe_signals', 'arb_alex',
  'yield_yuki', 'volkov_trade', 'katya_onchain', 'miner_x_ru', 'luna_defi_ru',
  'chart_master_ru',
];

// НОВЫЕ ЮЗЕРЫ (25.05–11.06)
const NEW_USERS = [
  { username: 'crypto_venom', fullName: 'Crypto Venom', bio: 'Хищник на бирже. Только точные входы. RU/EN', lang: 'ru' },
  { username: 'llama_signal', fullName: 'Llama Signal', bio: 'On-chain alpha from DefiLlama. DEX flows & yields.', lang: 'en' },
  { username: 'psycho_trader', fullName: 'Psycho Trader', bio: 'Психология трейдинга. Манименеджмент > стратегия. RU', lang: 'ru' },
  { username: 'eth_fanatic', fullName: 'ETH Fanatic', bio: 'Ethereum maximalist. L2s, staking, restaking.', lang: 'en' },
  { username: 'sol_pumper', fullName: 'SOL Pumper', bio: 'Солана — это космос. Мемы, деген, хайп. RU/UA', lang: 'ru' },
  { username: 'crypto_papa', fullName: 'Crypto Papa', bio: 'Опыт с 2017. Без FOMO, без паники. RU', lang: 'ru' },
  { username: 'theta_king', fullName: 'Theta King', bio: 'Options, IV, gamma risk on crypto perps.', lang: 'en' },
  { username: 'moon_mission', fullName: 'Moon Mission', bio: 'Ищу проекты x10 до листинга на CEX. DYOR', lang: 'en' },
  { username: 'red_pill_crypto', fullName: 'Red Pill Crypto', bio: 'Реальность крипты без прикрас. Скам, разборы, факты.', lang: 'ru' },
  { username: 'smart_money_eth', fullName: 'Smart Money ETH', bio: 'Tracking whale wallets. Accumulation/distribution zones.', lang: 'en' },
  { username: 'cryptoholic_ru', fullName: 'Cryptoholic RU', bio: 'Новости, слухи, инсайды. Без рекламы скамов.', lang: 'ru' },
  { username: 'dex_arb', fullName: 'DEX Arbitrageur', bio: 'Arb opportunities between DEXs. Fast execution.', lang: 'en' },
  { username: 'nft_godfather', fullName: 'NFT Godfather', bio: 'PFP, art, gaming NFTs. Floor sweeps and mints.', lang: 'en' },
  { username: 'russian_whale', fullName: 'Русский Кит', bio: 'Крупные потоки. Что покупают киты на самом деле. RU', lang: 'ru' },
  { username: 'gamma_gang', fullName: 'Gamma Gang', bio: 'Options, volatility, gamma exposure. Perp degen.', lang: 'en' },
  { username: 'crypto_angel', fullName: 'Crypto Angel', bio: 'Инвестирую в инфраструктуру. Долгосрок без плеча.', lang: 'ru' },
  { username: 'punk_2069', fullName: 'Punk 2069', bio: 'Cypherpunk values. Privacy, self-custody, Bitcoin.', lang: 'en' },
  { username: 'ta_king_ru', fullName: 'TA King RU', bio: 'Теханализ: уровни, паттерны, объемы. Без воды.', lang: 'ru' },
  { username: 'zk_evm_wizard', fullName: 'zkEVM Wizard', bio: 'ZK rollups, proofs, interoperability. Tech deep dives.', lang: 'en' },
  { username: 'crypto_mom', fullName: 'Crypto Mom', bio: 'Безопасное инвестирование. Как не потерять всё. RU', lang: 'ru' },
];

const ALL_USERNAMES = [...EXISTING_USERS, ...NEW_USERS.map(u => u.username)];

// ========== КОНФИГ ПО ДНЯМ (СУММА ~1000) ==========
const DAY_QUOTAS = [
  { date: '25.05.2026', count: 58 },
  { date: '26.05.2026', count: 56 },
  { date: '27.05.2026', count: 60 },
  { date: '28.05.2026', count: 55 },
  { date: '29.05.2026', count: 58 },
  { date: '30.05.2026', count: 52 },
  { date: '31.05.2026', count: 48 },
  { date: '01.06.2026', count: 60 },
  { date: '02.06.2026', count: 58 },
  { date: '03.06.2026', count: 56 },
  { date: '04.06.2026', count: 60 },
  { date: '05.06.2026', count: 55 },
  { date: '06.06.2026', count: 52 },
  { date: '07.06.2026', count: 48 },
  { date: '08.06.2026', count: 58 },
  { date: '09.06.2026', count: 56 },
  { date: '10.06.2026', count: 60 },
  { date: '11.06.2026', count: 50 }, // до ~1000
];

// ========== ТЕМЫ КОНТЕНТА ==========
const CONTENT_TYPES = {
  ANALYTICS: 'analytics',
  MEME: 'meme',
  NEWS: 'news',
  COMMUNITY_CTA: 'community_cta',
  PORTFOLIO: 'portfolio',
  TECH: 'tech',
  PSYCHOLOGY: 'psychology',
  ONCHAIN: 'onchain',
  MACRO: 'macro',
};

// Шаблоны по типам
const TEMPLATES = {
  [CONTENT_TYPES.ANALYTICS]: [
    '${symbol} ${direction} ${target} в ближайшие ${days} дней. Стоп ${stop}. NFA.',
    'Обновляю разбор по ${symbol}: ключевой уровень ${level}. Пробой = ${target}.',
    'Сетап по ${symbol}: вхожу от ${entry} с целью ${target}. Риск 1-2%.',
    'Технически ${symbol} сформировал ${pattern}. Подтверждение — закрытие выше ${confirmation}.',
    'Недельный обзор: ${symbol} ${sentiment}. Следующая зона интереса ${zone}.',
  ],
  [CONTENT_TYPES.NEWS]: [
    'Новость: ${news}. Реакция рынка: ${reaction}.',
    '${source} сообщает: ${headline}. Влияние на ${asset}: ${impact}.',
    'Слухи: ${rumor}. Если подтвердится — ${implication}.',
    'Горячо: ${development}. Мои действия: ${action}.',
  ],
  [CONTENT_TYPES.PORTFOLIO]: [
    'Портфель сегодня: +${change}%. Главный драйвер — ${winner}. Закрыл ${loser}.',
    'Добавил ${symbol} в кошелек. Причина: ${reason}. Размер: ${size}% портфеля.',
    'Зафиксировал ${profit}% по ${symbol}. Остаток со стопом в безубыток.',
    'Ребаланс: сократил ${out}, увеличил ${in}.',
    'Журнал: неудачный вход в ${symbol} — ${mistake}. Урок: ${lesson}.',
  ],
  [CONTENT_TYPES.PSYCHOLOGY]: [
    'Эмоции — главный враг трейдера. Сегодня ${emotion} почти заставил ${action}. Остановился. Жду сигнал.',
    'FOMO убивает депозит. Помню, как ${story}. Теперь только по плану.',
    'После ${event} всегда делаю паузу. Никаких сделок 24 часа.',
    'Совет новичкам: ${advice}. Начинайте с ${suggestion}.',
    'Дисциплина > стратегия. ${example}.',
  ],
  [CONTENT_TYPES.ONCHAIN]: [
    'Киты добавили ${amount} ${symbol} на холодное хранение. Бычий сигнал?',
    'Обменный резерв ${symbol} снизился на ${percent}% за неделю. Давление продавцов падает.',
    'Активных адресов в ${network} +${change}% WoW. Сеть оживает.',
    'Стейблкоин приток на биржи: +${mint}M за 24ч. Покупательная способность растет.',
    'Топ ${count} кошельков накапливают ${symbol}. Слежу за распределением.',
  ],
  [CONTENT_TYPES.MACRO]: [
    'DXY ${direction} на ${value}%. Риск-активы ${reaction}. BTC correlation ${correlation}.',
    'ФРС ${action}: ${message}. Рынок закладывает ${probability}% снижения ставки в ${month}.',
    'Доходность 10Y ${trend}. Крипта ${response}.',
    'Инфляция ${trend}: ожидания vs реальность. Мой план: ${plan}.',
  ],
  [CONTENT_TYPES.MEME]: [
    '${coin} to the moon! 🚀 Диапазон ${range}. NFA.',
    'Проснулся — ${coin} +${percent}%. Спасибо тем, кто ходил. 😂',
    'Мем коин дня: ${coin}. Причина: ${reason}. Заход на ${risk}.',
    'Пампа не будет без ${condition}. ${coin} пока только в мемы.',
    'Кто не рискнул вчера — ${coin} улетел. Сегодня ${new_coin}?',
  ],
  [CONTENT_TYPES.TECH]: [
    '${protocol} обновил ${feature}. Влияние: ${impact}.',
    'Глубокое погружение в ${project}. Основные фичи: ${features}.',
    'Бенчмарк: ${chain1} vs ${chain2} по ${metric}. Вывод: ${conclusion}.',
    '${upgrade} на ${network} активирован ${date}. Ожидаем ${effect}.',
  ],
  [CONTENT_TYPES.COMMUNITY_CTA]: [
    'Вступай в сообщество ${community}. Тема: ${topic}. Ссылка внизу 👇',
    'Веду ${community} — делюсь эксклюзивом. Присоединяйся через Join.',
    '${community}: ${description}. Кликай на ссылку, если тема твоя.',
    'Пиннул важное в ${community}. Заходи, пока не удалил.',
    'Новый разбор только в ${community}. Вступай бесплатно, без спама.',
  ],
};

// Заполнители для подстановки
const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'ARB', 'OP', 'MATIC', 'LINK', 'UNI', 'AAVE', 'PEPE', 'WIF', 'BONK', 'DOGE', 'SUI', 'APT', 'TIA', 'INJ', 'RNDR'];
const DIRECTIONS = ['пробивает сопротивление', 'тестирует поддержку', 'консолидируется', 'формирует флаг', 'отскакивает от зоны', 'ломает тренд'];
const SENTIMENTS = ['бычий', 'медвежий', 'нейтральный', 'волатильный', 'накопление', 'распределение'];
const PATTERNS = ['треугольник', 'двойное дно', 'голову и плечи', 'восходящий клин', 'нисходящий канал', 'флаг'];
const SOURCES = ['CoinDesk', 'The Block', 'Bloomberg Crypto', 'WSJ Crypto', 'Cointelegraph', 'Decrypt'];
const STORIES = ['купил на хае', 'продал перед пампом', 'пересидел с лосем', 'зафомал на слухах', 'взял слишком большое плечо'];
const EXAMPLES = ['держу стоп всегда', 'соблюдаю риск на сделку', 'веду журнал', 'не усредняю убытки'];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min, max, prefix = '', suffix = '') {
  const val = min + Math.random() * (max - min);
  return `${prefix}${val.toFixed(1)}${suffix}`;
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomTime() {
  const h = randomInt(6, 23);
  const m = randomInt(0, 59);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function fillTemplate(template, context) {
  let result = template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
  }
  return result;
}

function generatePostContent(type, communities = []) {
  const template = randomItem(TEMPLATES[type]);
  const symbol = randomItem(SYMBOLS);
  const community = communities[randomInt(0, communities.length - 1)] || { name: 'Crypto Hub', handle: 'crypto-hub', topic: 'крипто' };

  const context = {
    symbol,
    direction: randomItem(DIRECTIONS),
    target: randomNumber(5, 30, '', '%'),
    days: randomInt(3, 14),
    stop: randomNumber(3, 12, 'ниже ', '%'),
    level: `$${randomInt(20000, 100000)}`,
    entry: `$${randomInt(20000, 100000)}`,
    pattern: randomItem(PATTERNS),
    confirmation: `$${randomInt(21000, 100000)}`,
    sentiment: randomItem(SENTIMENTS),
    zone: `$${randomInt(18000, 95000)}-$${randomInt(21000, 105000)}`,
    news: `${symbol} ${randomItem(['листинг на CEX', 'партнерство с традиционной компанией', 'апгрейд сети', 'крупный байбек', 'институциональный приток'])}`,
    reaction: randomItem(['сдержанная', 'позитивная', 'нейтральная', 'волатильная', 'ожидаемая']),
    source: randomItem(SOURCES),
    headline: `${symbol} ${randomItem(['достиг нового максимума', 'тестирует ключевой уровень', 'показывает рост активности', 'привлек внимание китов'])}`,
    asset: symbol,
    impact: randomItem(['краткосрочный', 'долгосрочный', 'нейтральный', 'бычий', 'медвежий']),
    rumor: randomItem(['листинг на Binance', 'фонд накапливает', 'команда анонсирует buyback', 'крупный инвестор зашел']),
    implication: randomItem(['+10-15%', 'волатильность', 'накопление перед движением', 'возможный дамп']),
    development: randomItem(['SEC подает иск', 'ETF подают заявку', 'протокол взломан', 'TVL вырос на 30%']),
    action: randomItem(['уменьшил позицию', 'добавил на просадке', 'жду подтверждения', 'закрыл все перпы']),
    change: randomNumber(-5, 12, '', '%'),
    winner: randomItem(SYMBOLS),
    loser: randomItem(SYMBOLS),
    reason: randomItem(['фундаментал', 'технический пробой', 'лонг-сигнал от китов', 'накопление на низах']),
    size: randomInt(2, 15),
    profit: randomInt(8, 35),
    symbol_out: randomItem(SYMBOLS),
    symbol_in: randomItem(SYMBOLS),
    mistake: randomItem(['слишком большой размер', 'ранний вход', 'поздний выход', 'игнорирование стопа']),
    lesson: randomItem(EXAMPLES),
    emotion: randomItem(['страх', 'жадность', 'эйфория', 'паника']),
    action_emotion: randomItem(['открыть сделку', 'закрыть раньше времени', 'добавить плечо', 'усредниться']),
    story: randomItem(STORIES),
    event: randomItem(['лосся', 'тейка', 'новости', 'волатильности']),
    advice: randomItem(['никогда не рисковать более 2% портфеля', 'использовать стоп-лосс', 'не слушать сигнальщиков', 'вести журнал сделок']),
    suggestion: randomItem(['демо-счета', 'минимальных лотов', 'бумажного трейдинга', 'изучения风险管理']),
    example: randomItem(EXAMPLES),
    amount: randomNumber(50, 5000, '', 'M'),
    percent: randomNumber(1, 25, '', '%'),
    network: randomItem(['Ethereum', 'Solana', 'Arbitrum', 'Base', 'Avalanche']),
    mint: randomInt(150, 800),
    count: randomInt(10, 100),
    value: randomNumber(0.5, 3, '', '%'),
    trend: randomItem(['падает', 'растет', 'консолидируется', 'пробивает сопротивление']),
    response: randomItem(['игнорирует', 'следует корреляции', 'отстает', 'опережает']),
    probability: randomInt(30, 80),
    month: randomItem(['июня', 'июля', 'сентября', 'декабря']),
    plan: randomItem(['жду снижения ставки', 'накапливаю BTC/ETH', 'держу стейблы', 'увеличиваю риск']),
    coin: randomItem(['PEPE', 'WIF', 'BONK', 'DOGE', 'SHIB', 'FLOKI', 'BRETT']),
    range: `$${randomInt(10, 100)}-$${randomInt(110, 300)}`,
    percent_meme: randomInt(15, 80),
    reason_meme: randomItem(['социалка взлетела', 'кит зашел на $1M+', 'деген комьюнити спамит', 'листинг на DEX']),
    risk: randomItem(['2% портфеля', '5% лимитки', 'мелкая позиция', 'шорт-терм']),
    condition: randomItem(['объема', 'BTC вверх', 'хайпа в твиттере', 'накала страстей']),
    new_coin: randomItem(['PEPE2.0', 'WIF2', 'DOGEKILLER', 'MOONBAG', 'PUMPKIN']),
    protocol: randomItem(['Uniswap', 'Jupiter', 'Aave', 'Lido', 'EigenLayer', 'Hyperliquid']),
    feature: randomItem(['v4 апгрейд', 'новый пул ликвидности', 'снижение комиссий', 'кроссчейн мост']),
    impact_tech: randomItem(['TVL +15% ожидаем', 'транзакции вырастут', 'юзеры вернутся', 'конкуренты отстают']),
    project: randomItem(['zkSync', 'Scroll', 'Linea', 'Blast', 'Mode']),
    features: randomItem(['низкие комиссии', 'быстрые транзакции', 'открытый код', 'сильное комьюнити']),
    chain1: randomItem(['Arbitrum', 'Optimism', 'Base', 'zkSync']),
    chain2: randomItem(['Arbitrum', 'Optimism', 'Base', 'zkSync']),
    metric: randomItem(['TPS', 'медианной комиссии', 'активных адресов', 'объема DEX']),
    conclusion: randomItem(['лидер не меняется', 'догоняют', 'отрыв растет', 'конкуренция усиливается']),
    upgrade: randomItem(['Deneb', 'EIP-4844', 'Cancun', 'Fjord', 'Dencun']),
    date: randomItem(['через 2 недели', 'в июне', 'в июле', 'в этом квартале']),
    effect: randomItem(['рост экосистемы', 'снижение комиссий L2', 'увеличение blob-пространства', 'хорошо для роллапов']),
    community_name: community.name,
    community_handle: community.handle,
    topic: community.topic || 'крипто',
    description: community.description || `обсуждаем ${community.topic || 'крипту'}`,
  };

  let content = fillTemplate(template, context);
  
  // Добавляем хештеги иногда
  if (Math.random() > 0.7) {
    const tags = [`#${symbol}`, '#crypto', '#altcoins', '#trading', '#BTC', '#DeFi'];
    content += `\n\n${randomItem(tags)} ${randomItem(tags)}`;
  }
  
  return content;
}

function generateLinkAttachment(type, community) {
  if (type === CONTENT_TYPES.COMMUNITY_CTA && community) {
    const titles = [
      `Вступить в ${community.name}`,
      `Присоединиться к ${community.name}`,
      `${community.name} — сообщество`,
      `Join ${community.name}`,
      `Перейти в ${community.name}`,
    ];
    return {
      title: randomItem(titles).slice(0, 120),
      url: `/community/${community.handle}`,
    };
  }
  return undefined;
}

function generateEngagement() {
  const likes = randomInt(0, 24);
  const reposts = Math.random() > 0.85 ? randomInt(1, 5) : 0;
  let comments = undefined;
  
  if (Math.random() > 0.88) {
    const commentAuthors = [...ALL_USERNAMES];
    const commentCount = randomInt(1, 3);
    comments = [];
    for (let i = 0; i < commentCount; i++) {
      comments.push({
        by: randomItem(commentAuthors),
        text: randomItem([
          'Согласен, хорошая мысль.',
          'Интересно, слежу.',
          'Спасибо за инфу!',
          'Полезно, взял в заметки.',
          '👍',
          'Чётко, бро.',
          'Противоположного мнения, но уважаю анализ.',
          'Жду продолжения.',
          'А что насчет рисков?',
          'Уже в деле 🫡',
        ]),
        publishedAt: '',
      });
    }
  }
  
  return { likes, reposts, comments };
}

function generateMay25_June11Posts(communitiesInput = null) {
  const communities = communitiesInput && communitiesInput.length > 0
    ? communitiesInput.map(c => ({
        handle: c.handle,
        name: c.name,
        topic: c.topic || c.category || 'крипто',
        description: c.description,
      }))
    : DEFAULT_COMMUNITIES.map(c => ({
        handle: c.handle,
        name: c.name,
        topic: c.topic || 'крипто',
        description: c.description,
      }));

  const posts = [];
  let globalIdx = 0;
  const usedSet = new Set();

  for (const day of DAY_QUOTAS) {
    for (let i = 0; i < day.count; i++) {
      const author = randomItem(ALL_USERNAMES);
      
      // Выбираем тип контента
      let type;
      const rand = Math.random();
      if (rand < 0.25) type = CONTENT_TYPES.ANALYTICS;
      else if (rand < 0.40) type = CONTENT_TYPES.NEWS;
      else if (rand < 0.52) type = CONTENT_TYPES.PORTFOLIO;
      else if (rand < 0.62) type = CONTENT_TYPES.PSYCHOLOGY;
      else if (rand < 0.72) type = CONTENT_TYPES.ONCHAIN;
      else if (rand < 0.80) type = CONTENT_TYPES.MACRO;
      else if (rand < 0.88) type = CONTENT_TYPES.TECH;
      else if (rand < 0.95) type = CONTENT_TYPES.MEME;
      else type = CONTENT_TYPES.COMMUNITY_CTA;
      
      let content = generatePostContent(type, communities);
      const community = type === CONTENT_TYPES.COMMUNITY_CTA ? randomItem(communities) : null;
      const linkAttachment = generateLinkAttachment(type, community);
      
      // Уникальность контента
      let key = `${day.date}||${content}${linkAttachment ? `||${linkAttachment.url}` : ''}`;
      if (usedSet.has(key)) {
        content = `${content} (${globalIdx + 1})`;
        key = `${day.date}||${content}${linkAttachment ? `||${linkAttachment.url}` : ''}`;
      }
      usedSet.add(key);
      
      const eng = generateEngagement();
      
      const spec = {
        username: author,
        publishedAt: `${day.date} ${randomTime()}`,
        content,
        likes: eng.likes,
        reposts: eng.reposts,
      };
      
      if (linkAttachment) {
        spec.linkAttachment = linkAttachment;
      }
      
      if (eng.comments?.length) {
        spec.comments = eng.comments.map(c => ({
          ...c,
          publishedAt: `${day.date} ${randomTime()}`,
        }));
      }
      
      posts.push(spec);
      globalIdx++;
    }
  }
  
  return posts;
}

module.exports = {
  generateMay25_June11Posts,
  DAY_QUOTAS,
  ALL_USERNAMES,
  NEW_USERS,
  CONTENT_TYPES,
};