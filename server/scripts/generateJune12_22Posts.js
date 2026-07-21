/**
 * ~2000 постов за 12–22.06.2026 (до 10:30)
 * Упор: CTA в сообщества, новости, аналитика
 * Минимум комментариев и реакций
 */

// ========== 1000 НОВЫХ ПОЛЬЗОВАТЕЛЕЙ ==========
function generateUsers(count = 1000) {
    const users = [];
    const prefixes = [
      'crypto', 'btc', 'eth', 'sol', 'defi', 'nft', 'web3', 'chain', 'block', 'coin',
      'moon', 'star', 'galaxy', 'nova', 'ape', 'bull', 'bear', 'whale', 'shark', 'fox',
      'wolf', 'eagle', 'hawk', 'panda', 'koala', 'orca', 'dolphin', 'tiger', 'lion',
      'panther', 'jaguar', 'cheetah', 'falcon', 'raven', 'phoenix', 'dragon', 'unicorn',
      'satoshi', 'vitalik', 'cz', 'hayden', 'anatoly', 'gavin', 'justin', 'charlie',
      'digital', 'virtual', 'quantum', 'neon', 'cyber', 'astro', 'orbit', 'cosmos',
      'zen', 'yield', 'stake', 'farm', 'lend', 'borrow', 'swap', 'trade', 'invest',
      'hodl', 'bag', 'shrimp', 'crab', 'octopus', 'squid', 'narwhal', 'orca',
      'alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega', 'epsilon', 'zeta',
      'titan', 'zeus', 'ares', 'athena', 'apollo', 'artemis', 'hermes', 'dionysus'
    ];
    
    const suffixes = [
      'master', 'king', 'queen', 'lord', 'guard', 'hunter', 'chaser', 'rider',
      'walker', 'runner', 'shooter', 'miner', 'miner', 'trader', 'signals',
      'alpha', 'beta', 'pro', 'elite', 'prime', 'maxi', 'degen', 'ape',
      'whale', 'shark', 'pump', 'dump', 'moon', 'star', 'legend', 'hero'
    ];
  
    const used = new Set();
    let attempts = 0;
  
    while (users.length < count && attempts < 10000) {
      attempts++;
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      const num = Math.floor(Math.random() * 999);
      let username = `${prefix}_${suffix}${num}`;
      
      if (username.length > 20) {
        username = username.substring(0, 20);
      }
      
      if (!used.has(username)) {
        used.add(username);
        const fullName = username.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const lang = Math.random() > 0.5 ? 'ru' : 'en';
        const bios = [
          'Крипто-энтузиаст. Трейдер. Инвестор.',
          'Crypto enthusiast. Trader. Investor.',
          'DeFi & NFTs. Building the future.',
          'Мемы и фундаментал. В поисках альфы.',
          'Memes and fundamentals. Hunting alpha.',
          'On-chain analyst. Follow the whales.',
          'Ончейн-аналитик. Следую за китами.',
          'Futures & perps. Risk management first.',
          'Фьючерсы и перпы. Риск-менеджмент прежде всего.',
          'Solana ecosystem. Validator. Degen.',
          'Экосистема Solana. Валидатор. Деген.',
          'Bitcoin only. Self-custody. Orange pill.',
          'Только биткоин. Самохранение. Оранжевая таблетка.',
          'Ethereum & L2s. Restaking. Future of finance.',
          'Эфириум и L2. Рестейкинг. Будущее финансов.',
          'Teaching crypto to beginners. No scams.',
          'Обучаю крипте новичков. Без скамов.',
          'Quantitative trading. Statistics. Arbitrage.',
          'Количественный трейдинг. Статистика. Арбитраж.'
        ];
        users.push({
          username,
          fullName,
          bio: bios[Math.floor(Math.random() * bios.length)],
          lang: lang
        });
      }
    }
    
    return users;
  }
  
  const NEW_USERS = generateUsers(1000);
  
  const EXISTING_USERS = [
    'cryptoalpha', 'solwhale_io', 'defi_chad', 'btc_oracle_ru', 'memecoin_hunter',
    'chainscout', 'altseason_io', 'onchain_anna', 'perp_master', 'web3_daily',
    'eth_maxi', 'layer2_lisa', 'macro_mike', 'sol_degen_ru', 'funding_watcher',
    'stable_sage', 'nft_flipper', 'base_builder', 'riven_trades', 'orbit_eth',
    'nova_macro_ru', 'airdrop_ace', 'restaking_ray', 'pepe_signals', 'arb_alex',
    'yield_yuki', 'volkov_trade', 'katya_onchain', 'miner_x_ru', 'luna_defi_ru',
    'chart_master_ru', 'crypto_venom', 'llama_signal', 'psycho_trader',
    'eth_fanatic', 'sol_pumper', 'crypto_papa', 'theta_king', 'moon_mission',
    'red_pill_crypto', 'smart_money_eth', 'cryptoholic_ru', 'dex_arb',
    'nft_godfather', 'russian_whale', 'gamma_gang', 'crypto_angel',
    'punk_2069', 'ta_king_ru', 'zk_evm_wizard', 'crypto_mom',
    'crypto_sage', 'quant_king', 'btc_holder_forever', 'defi_detective',
    'moon_maker', 'sigma_trader', 'liquidity_whisperer', 'zk_ninja'
  ];
  
  const ALL_USERNAMES = [...EXISTING_USERS, ...NEW_USERS.map(u => u.username)];
  
  // ========== СООБЩЕСТВА ==========
  const COMMUNITIES = [
    { handle: 'whale-lounge', name: 'Whale Lounge', topic: 'крупный капитал', description: 'Закрытый клуб для крупных игроков' },
    { handle: 'quant-alpha', name: 'Quant Alpha', topic: 'количественный трейдинг', description: 'Математика и алгоритмы' },
    { handle: 'defi-vault', name: 'DeFi Vault', topic: 'DeFi стратегии', description: 'Стратегии доходности в DeFi' },
    { handle: 'rwa-investors', name: 'RWA Investors', topic: 'реальные активы', description: 'Токенизация реальных активов' },
    { handle: 'options-den', name: 'Options Den', topic: 'опционы', description: 'Торговля опционами' },
    { handle: 'zk-ecosystem', name: 'zk Ecosystem', topic: 'ZK-технологии', description: 'Zero Knowledge технологии' },
    { handle: 'solana-elite', name: 'Solana Elite', topic: 'Solana', description: 'Топ-комьюнити Solana' },
    { handle: 'macro-circle', name: 'Macro Circle', topic: 'макроанализ', description: 'Глобальный макроанализ' },
    { handle: 'memecoin-lab', name: 'Memecoin Lab', topic: 'мемкоины', description: 'Мемкоины и нарративы' },
    { handle: 'trading-floor', name: 'Trading Floor', topic: 'трейдинг', description: 'Трейдинг и риск-менеджмент' },
    { handle: 'onchain-radar', name: 'Onchain Radar', topic: 'ончейн', description: 'Ончейн-потоки' },
    { handle: 'yield-masters', name: 'Yield Masters', topic: 'доходность', description: 'Доходность и стейблы' },
    { handle: 'perp-academy', name: 'Perp Academy', topic: 'фандинг', description: 'Фандинг и ликвидации' },
    { handle: 'btc-macro-desk', name: 'BTC Macro Desk', topic: 'BTC и макро', description: 'BTC и макроэкономика' },
    { handle: 'defi-perps-hub', name: 'DeFi & Perps Hub', topic: 'DeFi и перпы', description: 'DeFi и перпетуалы' },
  ];
  
  // ========== КОНФИГ ПО ДНЯМ (12-22 июня до 10:30) ==========
  const DAY_QUOTAS = [
    { date: '12.06.2026', count: 150 },
    { date: '13.06.2026', count: 150 },
    { date: '14.06.2026', count: 130 },
    { date: '15.06.2026', count: 170 },
    { date: '16.06.2026', count: 170 },
    { date: '17.06.2026', count: 180 },
    { date: '18.06.2026', count: 190 },
    { date: '19.06.2026', count: 210 },
    { date: '20.06.2026', count: 220 },
    { date: '21.06.2026', count: 230 },
    { date: '22.06.2026', count: 200 }, // до 10:30
  ];
  
  // ========== КОНТЕНТ ==========
  // CTA шаблоны (основной упор)
  const CTA_TEMPLATES = [
    // Русские
    'Присоединяйся к ${community} — лучшее место для ${topic}. Вступай по ссылке 👇',
    '${community} открыт для новых участников. Обсуждаем ${topic}. Жми на ссылку!',
    'Хочешь быть в теме ${topic}? Заходи в ${community}. Ссылка ниже 👇',
    'Эксклюзивный контент по ${topic} только в ${community}. Вступай!',
    '${community}: ${description}. Присоединяйся к сообществу!',
    'Новый разбор в ${community}. Заходи, пока актуально. Ссылка внизу.',
    'Ищешь команду по ${topic}? ${community} ждет тебя!',
    '${community} — твой источник информации по ${topic}. Вступай бесплатно.',
    'Обсуждаем ${topic} в ${community}. Присоединяйся к чату!',
    'Только в ${community}: свежие идеи по ${topic}. Заходи!',
    '${community} — сообщество для тех, кто в теме ${topic}. Вступление открыто.',
    'Полезные материалы по ${topic} в ${community}. Жми на ссылку!',
    '${community}: место, где обсуждают ${topic}. Присоединяйся!',
    'Хочешь узнавать о ${topic} первым? Вступай в ${community}.',
    '${community} — твой клуб по интересам. Тема: ${topic}. Заходи!',
    
    // Английские
    'Join ${community} — the best place for ${topic}. Click the link below 👇',
    '${community} is open for new members. We discuss ${topic}. Join now!',
    'Want to stay ahead on ${topic}? Join ${community}. Link below 👇',
    'Exclusive content on ${topic} only in ${community}. Join us!',
    '${community}: ${description}. Join the community today!',
    'New analysis in ${community}. Check it out while it\'s hot. Link below.',
    'Looking for a team on ${topic}? ${community} is waiting for you!',
    '${community} — your source for ${topic}. Join for free.',
    'Discussing ${topic} in ${community}. Join the chat!',
    'Only in ${community}: fresh ideas on ${topic}. Come in!',
  ];
  
  // Новости
  const NEWS_TEMPLATES = [
    'Новость: ${news}. Подробности в ${community}. Вступай, чтобы быть в курсе.',
    '${headline}. Полный разбор в ${community}. Ссылка ниже.',
    'Слухи: ${rumor}. Обсуждаем в ${community}. Присоединяйся!',
    'Важное обновление: ${update}. Читай в ${community}.',
    'Срочно: ${breaking}. Актуальные комментарии в ${community}.',
    'News: ${news}. Full analysis in ${community}. Join us.',
    '${headline}. Complete breakdown in ${community}. Link below.',
    'Rumors: ${rumor}. Discussing in ${community}. Join now!',
    'Breaking: ${breaking}. Live updates in ${community}.',
  ];
  
  // Аналитика
  const ANALYTICS_TEMPLATES = [
    '${symbol} ${direction}. Мои мысли в ${community}. Заходи обсудить!',
    'Разбор ${symbol}: ${analysis}. Полный пост в ${community}.',
    '${symbol} на ${level}. Детальный анализ в ${community}. Вступай!',
    'Сетап по ${symbol}. Таргет ${target}. Обсуждаем в ${community}.',
    '${symbol} ${sentiment}. Больше подробностей в ${community}.',
    '${symbol} ${direction}. My thoughts in ${community}. Join the discussion!',
    '${symbol} analysis: ${analysis}. Full post in ${community}.',
    '${symbol} at ${level}. Detailed analysis in ${community}. Join us!',
    '${symbol} setup. Target ${target}. Discussing in ${community}.',
    '${symbol} ${sentiment}. More details in ${community}.',
  ];
  
  // ========== ЗАПОЛНИТЕЛИ ==========
  const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'ARB', 'OP', 'MATIC', 'LINK', 'UNI', 'AAVE', 'PEPE', 'WIF', 'BONK', 'DOGE', 'SUI', 'APT', 'TIA', 'INJ', 'RNDR', 'SEI', 'AVAX'];
  const DIRECTIONS = ['пробивает сопротивление', 'тестирует поддержку', 'консолидируется', 'формирует флаг', 'отскакивает от зоны', 'прорывает уровень', 'закрепился выше'];
  const SENTIMENTS = ['бычий', 'медвежий', 'нейтральный', 'волатильный', 'накопление', 'коррекция'];
  const HEADLINES = [
    'BTC тестирует $110k', 'ETH обновляет локальный максимум', 'SOL показывает рост активности',
    'Крупный инвестор зашел в ARB', 'TVL DeFi вырос на 15%', 'Новый листинг на Binance',
    'Институциональный приток в BTC', 'SEC откладывает решение по ETF', 'Китайский банк запускает CBDC'
  ];
  const UPDATES = [
    'Uniswap v4 запускается в июле', 'EigenLayer обновляет контракты', 'Arbitrum анонсирует стейкинг',
    'Solana обновляет валидаторы', 'Optimism запускает суперчейн', 'Base привлекает новых разработчиков'
  ];
  const BREAKING = [
    'BTC падает на 3%', 'ETH показывает волатильность', 'SEC анонсирует решение по ETF',
    'Крупный взлом биржи', 'Институциональный приток $500M', 'ФРС сохраняет ставку'
  ];
  const ANALYSES = [
    'бычий дивергенция на RSI', 'формирование треугольника', 'пробой нисходящего тренда',
    'объемы растут на пробое', 'медвежий клин формируется', 'бычий флаг на дневном ТФ'
  ];
  
  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  function randomInt(min, max) {
    return Math.floor(min + Math.random() * (max - min + 1));
  }
  
  function randomTime() {
    const h = randomInt(6, 10); // до 10:30
    const m = randomInt(0, 29);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
  
  function fillTemplate(template, context) {
    let result = template;
    for (const [key, value] of Object.entries(context)) {
      result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
    }
    return result;
  }
  
  function generatePostContent(communities) {
    const community = randomItem(communities);
    
    // 80% CTA, 10% новости, 10% аналитика
    const rand = Math.random();
    
    let template;
    let context = {
      community: community.name,
      topic: community.topic,
      description: community.description,
      symbol: randomItem(SYMBOLS),
      direction: randomItem(DIRECTIONS),
      sentiment: randomItem(SENTIMENTS),
      news: randomItem(['листинг на CEX', 'партнерство', 'апгрейд сети', 'байбек', 'институциональный приток']),
      headline: randomItem(HEADLINES),
      rumor: randomItem(['листинг на Binance', 'фонд накапливает', 'команда анонсирует buyback', 'крупный инвестор зашел']),
      update: randomItem(UPDATES),
      breaking: randomItem(BREAKING),
      analysis: randomItem(ANALYSES),
      level: `$${randomInt(20000, 110000)}`,
      target: randomInt(5, 40) + '%',
    };
  
    if (rand < 0.80) {
      // CTA
      template = randomItem(CTA_TEMPLATES);
    } else if (rand < 0.90) {
      // Новости
      template = randomItem(NEWS_TEMPLATES);
    } else {
      // Аналитика
      template = randomItem(ANALYTICS_TEMPLATES);
    }
  
    let content = fillTemplate(template, context);
    
    // Добавляем хештеги (иногда)
    if (Math.random() > 0.6) {
      const tags = ['#crypto', '#trading', '#DeFi', '#BTC', '#altcoins', '#Web3'];
      content += `\n\n${randomItem(tags)} ${randomItem(tags)}`;
    }
  
    return content;
  }
  
  function generateLinkAttachment(type, community) {
    const titles = [
      `Вступить в ${community.name}`,
      `Присоединиться к ${community.name}`,
      `${community.name} — сообщество`,
      `Join ${community.name}`,
      `Перейти в ${community.name}`,
      `Зайти в ${community.name}`,
    ];
    return {
      title: randomItem(titles).slice(0, 120),
      url: `/community/${community.handle}`,
    };
  }
  
  function generateEngagement(allUsernames) {
    // Минимальные реакции
    const likes = randomInt(0, 5);
    const reposts = Math.random() > 0.95 ? randomInt(1, 2) : 0;
    let comments = undefined;
  
    // Комментарии очень редко
    if (Math.random() > 0.97) {
      const commentAuthors = [...allUsernames];
      const commentCount = randomInt(1, 2);
      comments = [];
      const commentTexts = [
        'Спасибо, зашел.',
        'Joined!',
        'Уже в сообществе 🔥',
        'Полезная инфа.',
        'Согласен.',
        '👍',
      ];
      for (let i = 0; i < commentCount; i++) {
        comments.push({
          by: randomItem(commentAuthors),
          text: randomItem(commentTexts),
          publishedAt: '',
        });
      }
    }
  
    return { likes, reposts, comments };
  }
  
  function generateJune12_22Posts(communitiesInput = null) {
    const allCommunities = communitiesInput && communitiesInput.length > 0
      ? communitiesInput
      : COMMUNITIES;
  
    const posts = [];
    let globalIdx = 0;
    const usedSet = new Set();
  
    for (const day of DAY_QUOTAS) {
      for (let i = 0; i < day.count; i++) {
        const author = randomItem(ALL_USERNAMES);
        const community = randomItem(allCommunities);
        
        // Все посты с CTA (почти всегда есть ссылка)
        const content = generatePostContent(allCommunities);
        const linkAttachment = generateLinkAttachment('community_cta', community);
  
        let key = `${day.date}||${content}||${linkAttachment.url}`;
        if (usedSet.has(key)) {
          content = `${content} (${globalIdx + 1})`;
          key = `${day.date}||${content}||${linkAttachment.url}`;
        }
        usedSet.add(key);
  
        const eng = generateEngagement(ALL_USERNAMES);
  
        const spec = {
          username: author,
          publishedAt: `${day.date} ${randomTime()}`,
          content,
          likes: eng.likes,
          reposts: eng.reposts,
          linkAttachment,
        };
  
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
    generateJune12_22Posts,
    DAY_QUOTAS,
    ALL_USERNAMES,
    NEW_USERS,
    COMMUNITIES,
  };