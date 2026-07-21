/**
 * 800+ постов за 12–20.06.2026
 * Новые юзеры, закрытые сообщества, аналитика, мемы, фундаментал, CTA
 */

const { COMMUNITIES: DEFAULT_COMMUNITIES } = require('./generateMay21Posts');

// ========== НОВЫЕ ПОЛЬЗОВАТЕЛИ (12-20 июня) ==========
const NEW_USERS = [
  { username: 'crypto_sage', fullName: 'Crypto Sage', bio: 'Мудрость рынка. 8 лет в крипте. Без эмоций.', lang: 'ru' },
  { username: 'quant_king', fullName: 'Quant King', bio: 'Quantitative analysis. Statistical arbitrage. PhD in Math.', lang: 'en' },
  { username: 'btc_holder_forever', fullName: 'BTC Holder Forever', bio: 'Bitcoin only. Self-custody. Orange pill.', lang: 'en' },
  { username: 'defi_detective', fullName: 'DeFi Detective', bio: 'Раскрываю схемы. Ищу уязвимости. Безопасность.', lang: 'ru' },
  { username: 'moon_maker', fullName: 'Moon Maker', bio: 'Делаю луну. Мемы, тренды, хайп. NFA.', lang: 'ru' },
  { username: 'sigma_trader', fullName: 'Sigma Trader', bio: 'Сигма-трейдинг. Только хладнокровие и профит.', lang: 'ru' },
  { username: 'liquidity_whisperer', fullName: 'Liquidity Whisperer', bio: 'Читаю ликвидность как книгу. Order flow expert.', lang: 'en' },
  { username: 'zk_ninja', fullName: 'zk Ninja', bio: 'Zero Knowledge. Privacy. Scaling. Tech deep dives.', lang: 'en' },
  { username: 'crypto_guardian', fullName: 'Crypto Guardian', bio: 'Защита инвесторов. Разбор скамов. Безопасные проекты.', lang: 'ru' },
  { username: 'ape_together', fullName: 'Ape Together', bio: 'Вместе мы сила. Сообщество дегенов с душой.', lang: 'ru' },
  { username: 'theta_strategist', fullName: 'Theta Strategist', bio: 'Options strategies. Theta decay. IV crush.', lang: 'en' },
  { username: 'rwa_visionary', fullName: 'RWA Visionary', bio: 'Real World Assets. Tokenization. Future of finance.', lang: 'en' },
  { username: 'crypto_teacher', fullName: 'Crypto Teacher', bio: 'Обучаю крипте с нуля. Без воды и скамов.', lang: 'ru' },
  { username: 'solanero', fullName: 'Solanero', bio: 'Solana ecosystem. Validators. NFT. DeFi on SOL.', lang: 'en' },
  { username: 'eth_bull_2026', fullName: 'ETH Bull 2026', bio: 'Ethereum на $10k+ к 2027. L2, restaking, future.', lang: 'ru' },
  { username: 'market_psych', fullName: 'Market Psych', bio: 'Психология рынка. Толпа, страх, жадность. Читаю настроения.', lang: 'ru' },
  { username: 'onchain_oracle', fullName: 'Onchain Oracle', bio: 'Говорю с цепочкой. Ончейн-данные для всех.', lang: 'ru' },
  { username: 'yield_farmer_eth', fullName: 'Yield Farmer', bio: 'Фармим доходность. Staking, lending, LPs.', lang: 'ru' },
  { username: 'macro_whale', fullName: 'Macro Whale', bio: 'Global macro. Fed, inflation, liquidity cycles.', lang: 'en' },
  { username: 'crypto_jedi', fullName: 'Crypto Jedi', bio: 'Сила в знании. Холодный ум, горячий портфель.', lang: 'ru' },
  { username: 'arb_pro', fullName: 'Arb Pro', bio: 'Арбитраж между биржами. Мгновенные сделки. Низкий риск.', lang: 'en' },
  { username: 'memelord_69', fullName: 'Memelord 69', bio: 'Повелитель мемов. Смеюсь над рынком и собой.', lang: 'ru' },
  { username: 'ai_crypto_bot', fullName: 'AI Crypto Bot', bio: 'AI-powered trading signals. Machine learning models.', lang: 'en' },
  { username: 'crypto_architect', fullName: 'Crypto Architect', bio: 'Строю DeFi. Разбираю протоколы. Архитектура Web3.', lang: 'ru' },
  { username: 'btc_maximalist_ru', fullName: 'Bitcoin Maximalist', bio: 'Только биткоин. Все остальное — шум.', lang: 'ru' },
];

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
];

const ALL_USERNAMES = [...EXISTING_USERS, ...NEW_USERS.map(u => u.username)];

// ========== НОВЫЕ ЗАКРЫТЫЕ СООБЩЕСТВА ==========
// Допустимые категории: crypto, trading, defi, nft, web3, memes, macro, tech
const NEW_COMMUNITIES = [
  { 
    handle: 'whale-lounge', 
    name: 'Whale Lounge', 
    topic: 'крупный капитал и институционалы',
    category: 'trading',
    description: 'Закрытый клуб для владельцев 100+ BTC. Вход по приглашениям.',
    isPrivate: true,
  },
  { 
    handle: 'quant-alpha', 
    name: 'Quant Alpha', 
    topic: 'количественный трейдинг и алгоритмы',
    category: 'trading',
    description: 'Математика, статистика, алгоритмы. Для профессиональных трейдеров.',
    isPrivate: true,
  },
  { 
    handle: 'defi-vault', 
    name: 'DeFi Vault', 
    topic: 'DeFi стратегии и доходность',
    category: 'defi',
    description: 'Закрытое сообщество для DeFi-стратегов. Делимся эксклюзивными грейдами.',
    isPrivate: true,
  },
  { 
    handle: 'rwa-investors', 
    name: 'RWA Investors', 
    topic: 'токенизированные реальные активы',
    category: 'crypto',
    description: 'Инвестиции в RWA: недвижимость, облигации, commodities. Только проверенные игроки.',
    isPrivate: true,
  },
  { 
    handle: 'options-den', 
    name: 'Options Den', 
    topic: 'опционы и деривативы',
    category: 'trading',
    description: 'Торговля опционами на крипту. Стратегии, риски, греки.',
    isPrivate: true,
  },
  { 
    handle: 'zk-ecosystem', 
    name: 'zk Ecosystem', 
    topic: 'ZK-технологии и приватность',
    category: 'tech',
    description: 'Разработчики, исследователи, энтузиасты ZK. Закрытый чат для билдеров.',
    isPrivate: true,
  },
  { 
    handle: 'solana-elite', 
    name: 'Solana Elite', 
    topic: 'Solana экосистема и NFT',
    category: 'web3',
    description: 'Топ-комьюнити Solana. Вход после проверки портфеля.',
    isPrivate: true,
  },
  { 
    handle: 'macro-circle', 
    name: 'Macro Circle', 
    topic: 'глобальный макроанализ',
    category: 'macro',
    description: 'ФРС, инфляция, геополитика. Аналитика от профессионалов.',
    isPrivate: true,
  },
];

// ========== КОНФИГ ПО ДНЯМ ==========
const DAY_QUOTAS = [
  { date: '12.06.2026', count: 95 },
  { date: '13.06.2026', count: 88 },
  { date: '14.06.2026', count: 75 },
  { date: '15.06.2026', count: 95 },
  { date: '16.06.2026', count: 90 },
  { date: '17.06.2026', count: 92 },
  { date: '18.06.2026', count: 88 },
  { date: '19.06.2026', count: 85 },
  { date: '20.06.2026', count: 72 },
];

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

// ========== ШАБЛОНЫ (русские и английские) ==========
const TEMPLATES = {
  [CONTENT_TYPES.ANALYTICS]: [
    '${symbol} ${direction} к ${target} в течение ${days} дней. Стоп ${stop}. Не финансовый совет.',
    'Разбор ${symbol}: ключевой уровень ${level}. Пробой даст ${target}.',
    'Сетап по ${symbol}: вход от ${entry} до ${target}. Риск 1-2% депозита.',
    '${symbol} сформировал ${pattern} на дневном графике. Ждем закрытия выше ${confirmation}.',
    'Недельный обзор ${symbol}: ${sentiment}. Следующая зона — ${zone}.',
    'Обновляю анализ ${symbol}: бычий дивергенция на RSI. Цель ${target}.',
    '${symbol} держит ${support}. Пока не пробьем — шорты не рассматриваю.',
    '${symbol} ${direction} toward ${target} within ${days} days. Stop ${stop}. NFA.',
    '${symbol} update: key level ${level}. Breakout = ${target}.',
    '${symbol} setup: entry ${entry}, target ${target}. Risk 1-2%.',
    '${symbol} formed ${pattern} on daily. Waiting for close above ${confirmation}.',
    'Weekly ${symbol} review: ${sentiment}. Next zone ${zone}.',
    '${symbol} analysis update: bullish divergence on RSI. Target ${target}.',
  ],
  [CONTENT_TYPES.NEWS]: [
    'Новость: ${news}. Рынок реагирует ${reaction}.',
    '${source} сообщает: ${headline}. Влияние на ${asset}: ${impact}.',
    'Слухи о ${rumor}. Если подтвердится — ${implication}.',
    'Важно: ${development}. Мои действия — ${action}.',
    'Только что: ${breaking}. Короткий комментарий: ${comment}.',
    'News: ${news}. Market reaction: ${reaction}.',
    '${source} reports: ${headline}. Impact on ${asset}: ${impact}.',
    'Rumors about ${rumor}. If confirmed — ${implication}.',
    'Breaking: ${development}. My move: ${action}.',
  ],
  [CONTENT_TYPES.PORTFOLIO]: [
    'Портфель сегодня: ${change}%. Главный драйвер — ${winner}. Закрыл ${loser}.',
    'Добавил ${symbol} в портфель. Причина: ${reason}. Доля: ${size}%.',
    'Зафиксировал ${profit}% по ${symbol}. Остаток в безубыток.',
    'Ребаланс: уменьшил ${out}, увеличил ${in}.',
    'Журнал сделок: ошибка в ${symbol} — ${mistake}. Урок: ${lesson}.',
    'Portfolio today: ${change}%. Top performer: ${winner}. Closed ${loser}.',
    'Added ${symbol} to portfolio. Reason: ${reason}. Allocation: ${size}%.',
    'Took ${profit}% profit on ${symbol}. Remainder at breakeven.',
    'Rebalance: trimmed ${out}, added ${in}.',
    'Trade journal: mistake on ${symbol} — ${mistake}. Lesson: ${lesson}.',
  ],
  [CONTENT_TYPES.PSYCHOLOGY]: [
    'Эмоции — враг трейдера. Сегодня ${emotion} чуть не заставил ${action}. Остановился.',
    'FOMO убивает. Помню, как ${story}. Теперь только по плану.',
    'После ${event} всегда беру паузу. 24 часа без сделок.',
    'Совет: ${advice}. Начните с ${suggestion}.',
    'Дисциплина важнее стратегии. ${example}.',
    'Задайте себе вопрос: "Я торгую по плану или по эмоциям?" Честный ответ спасает депозит.',
    'Emotions are trader\'s enemy. Today ${emotion} almost made me ${action}. I stopped.',
    'FOMO kills accounts. I remember when ${story}. Now only by plan.',
    'After ${event} I always pause. 24 hours no trades.',
    'My advice: ${advice}. Start with ${suggestion}.',
    'Discipline > strategy. ${example}.',
  ],
  [CONTENT_TYPES.ONCHAIN]: [
    'Киты вывели ${amount} ${symbol} на холод. Бычий сигнал?',
    'Обменный резерв ${symbol} упал на ${percent}% за неделю. Продавцы слабеют.',
    'Активные адреса в ${network} выросли на ${change}% WoW. Сеть оживает.',
    'Приток стейблов на биржи: +${mint}M за 24ч. Покупательная способность растет.',
    'Топ ${count} кошельков накапливают ${symbol}. Слежу за распределением.',
    'Whales moved ${amount} ${symbol} to cold storage. Bullish signal?',
    'Exchange reserves of ${symbol} dropped ${percent}% WoW. Selling pressure easing.',
    'Active addresses on ${network} up ${change}% WoW. Network warming up.',
    'Stablecoin inflows to exchanges: +${mint}M in 24h. Buying power increasing.',
    'Top ${count} wallets accumulating ${symbol}. Watching distribution.',
  ],
  [CONTENT_TYPES.MACRO]: [
    'DXY ${direction} на ${value}%. Риск-активы ${reaction}. Корреляция с BTC ${correlation}.',
    'ФРС ${action}: ${message}. Рынок закладывает ${probability}% снижения ставки.',
    'Доходность 10Y ${trend}. Крипта ${response}.',
    'Инфляция ${trend}: ожидания vs факт. Мой план — ${plan}.',
    'DXY ${direction} ${value}%. Risk assets ${reaction}. BTC correlation ${correlation}.',
    'Fed ${action}: ${message}. Markets pricing ${probability}% rate cut.',
    '10Y yield ${trend}. Crypto ${response}.',
    'Inflation ${trend}: expectations vs reality. My plan: ${plan}.',
  ],
  [CONTENT_TYPES.MEME]: [
    '${coin} на луну! 🚀 Диапазон ${range}. Только для развлечения.',
    'Проснулся — ${coin} +${percent}%. Кто был в лонге?',
    'Мемкоин дня: ${coin}. Причина: ${reason}. Заход на ${risk}.',
    'Без ${condition} пампа не будет. ${coin} пока только в мемах.',
    'Вчера не рискнул — ${coin} улетел. Сегодня ${new_coin}?',
    'Портфель в мемах: ${coin} и ${coin2}. Ждем сигнала 🚀',
    '${coin} to the moon! 🚀 Range ${range}. For entertainment only.',
    'Woke up — ${coin} +${percent}%. Who was long?',
    'Meme coin of the day: ${coin}. Reason: ${reason}. Risk ${risk}.',
    'No pump without ${condition}. ${coin} still just memes.',
    'Didn\'t risk yesterday — ${coin} flew. Today ${new_coin}?',
    'Portfolio in memes: ${coin} and ${coin2}. Waiting for signal 🚀',
  ],
  [CONTENT_TYPES.TECH]: [
    '${protocol} обновил ${feature}. Влияние: ${impact}.',
    'Погружение в ${project}. Ключевые фичи: ${features}.',
    'Сравнение ${chain1} vs ${chain2} по ${metric}. Вывод: ${conclusion}.',
    '${upgrade} на ${network} активируется ${date}. Ожидаем ${effect}.',
    '${protocol} upgraded ${feature}. Impact: ${impact}.',
    'Deep dive into ${project}. Key features: ${features}.',
    'Benchmark: ${chain1} vs ${chain2} on ${metric}. Verdict: ${conclusion}.',
    '${upgrade} on ${network} goes live ${date}. Expected: ${effect}.',
  ],
  [CONTENT_TYPES.COMMUNITY_CTA]: [
    'Присоединяйся к закрытому сообществу ${community}. Тема: ${topic}. Вход по ссылке 👇',
    '${community} — место для ${topic}. Вступай, если не боишься дегена.',
    'Эксклюзивный разбор только в ${community}. Жми на ссылку.',
    'Новый пин в ${community}. Заходи, пока актуально.',
    '${community}: ${description}. Кнопка Join ниже.',
    'Join our private community ${community}. Topic: ${topic}. Link below 👇',
    '${community} — the place for ${topic}. Join if you\'re not afraid to degen.',
    'Exclusive analysis only in ${community}. Click the link.',
    'New pin in ${community}. Check it out while it\'s hot.',
    '${community}: ${description}. Join button below.',
  ],
};

// ========== ЗАПОЛНИТЕЛИ ==========
const SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'ARB', 'OP', 'MATIC', 'LINK', 'UNI', 'AAVE', 'PEPE', 'WIF', 'BONK', 'DOGE', 'SUI', 'APT', 'TIA', 'INJ', 'RNDR', 'SEI', 'ATOM', 'DOT', 'AVAX'];
const DIRECTIONS = ['пробивает сопротивление', 'тестирует поддержку', 'консолидируется', 'формирует флаг', 'отскакивает от зоны', 'ломает тренд', 'прорывает уровень', 'закрепился выше'];
const SENTIMENTS = ['бычий', 'медвежий', 'нейтральный', 'волатильный', 'накопление', 'распределение', 'коррекция'];
const PATTERNS = ['треугольник', 'двойное дно', 'голову и плечи', 'восходящий клин', 'нисходящий канал', 'флаг', 'бычий клин', 'медвежий флаг'];
const SOURCES = ['CoinDesk', 'The Block', 'Bloomberg Crypto', 'WSJ Crypto', 'Cointelegraph', 'Decrypt', 'Unchained', 'The Defiant'];
const STORIES = ['купил на хае', 'продал перед пампом', 'пересидел с лосем', 'зафомал на слухах', 'взял слишком большое плечо', 'не закрыл тейк', 'усреднился в падении'];
const EXAMPLES = ['держу стоп всегда', 'соблюдаю риск на сделку', 'веду журнал', 'не усредняю убытки', 'использую лимитки', 'смотрю фундаментал'];
const REACTIONS = ['сдержанная', 'позитивная', 'нейтральная', 'волатильная', 'ожидаемая', 'бычья', 'медвежья'];
const IMPACTS = ['краткосрочный', 'долгосрочный', 'нейтральный', 'бычий', 'медвежий', 'значительный', 'умеренный'];

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

function generatePostContent(type, communities = [], allSymbols = SYMBOLS) {
  const template = randomItem(TEMPLATES[type]);
  const symbol = randomItem(allSymbols);
  const community = communities[randomInt(0, communities.length - 1)] || { 
    name: 'Crypto Hub', 
    handle: 'crypto-hub', 
    topic: 'крипто',
    description: 'крипто-сообщество',
  };

  const symbols2 = allSymbols.filter(s => s !== symbol);
  const coin2 = randomItem(symbols2.length > 0 ? symbols2 : allSymbols);

  const context = {
    symbol,
    direction: randomItem(DIRECTIONS),
    target: randomNumber(5, 40, '', '%'),
    days: randomInt(3, 14),
    stop: randomNumber(2, 12, 'ниже ', '%'),
    level: `$${randomInt(20000, 110000)}`,
    entry: `$${randomInt(20000, 110000)}`,
    pattern: randomItem(PATTERNS),
    confirmation: `$${randomInt(21000, 110000)}`,
    sentiment: randomItem(SENTIMENTS),
    zone: `$${randomInt(18000, 95000)}-$${randomInt(21000, 110000)}`,
    news: `${symbol} ${randomItem(['листинг на CEX', 'партнерство с традиционной компанией', 'апгрейд сети', 'крупный байбек', 'институциональный приток', 'кит накупил на $50M+', 'TVL вырос на 20%'])}`,
    reaction: randomItem(REACTIONS),
    source: randomItem(SOURCES),
    headline: `${symbol} ${randomItem(['достиг нового максимума', 'тестирует ключевой уровень', 'показывает рост активности', 'привлек внимание китов', 'лидирует по объемам', 'обновляет ATH', 'корректируется после ралли'])}`,
    asset: symbol,
    impact: randomItem(IMPACTS),
    rumor: randomItem(['листинг на Binance', 'фонд накапливает', 'команда анонсирует buyback', 'крупный инвестор зашел', 'слияние с другим протоколом', 'институциональный интерес']),
    implication: randomItem(['+10-20%', 'волатильность', 'накопление перед движением', 'возможный дамп', 'бычий импульс', 'медвежий разворот']),
    development: randomItem(['SEC подает иск', 'ETF подают заявку', 'протокол взломан', 'TVL вырос на 30%', 'команда делает байбек', 'форк сети', 'новый релиз']),
    action: randomItem(['уменьшил позицию', 'добавил на просадке', 'жду подтверждения', 'закрыл все перпы', 'перешел в стейблы', 'нарастил лонг']),
    change: randomNumber(-8, 15, '', '%'),
    winner: randomItem(allSymbols.filter(s => s !== symbol)),
    loser: randomItem(allSymbols.filter(s => s !== symbol && s !== 'BTC')),
    reason: randomItem(['фундаментал', 'технический пробой', 'лонг-сигнал от китов', 'накопление на низах', 'рост объема', 'крупный контракт']),
    size: randomInt(2, 20),
    profit: randomInt(5, 45),
    symbol_out: randomItem(allSymbols),
    symbol_in: randomItem(allSymbols),
    mistake: randomItem(['слишком большой размер', 'ранний вход', 'поздний выход', 'игнорирование стопа', 'эмоциональный трейд', 'перегрузка плечом']),
    lesson: randomItem(EXAMPLES),
    emotion: randomItem(['страх', 'жадность', 'эйфория', 'паника', 'нетерпение', 'уверенность']),
    action_emotion: randomItem(['открыть сделку', 'закрыть раньше времени', 'добавить плечо', 'усредниться', 'войти против тренда']),
    story: randomItem(STORIES),
    event: randomItem(['лосся', 'тейка', 'новости', 'волатильности', 'памп', 'дамп']),
    advice: randomItem([
      'никогда не рисковать более 2% портфеля', 
      'использовать стоп-лосс', 
      'не слушать сигнальщиков', 
      'вести журнал сделок',
      'не торговать на новостях',
      'смотреть таймфреймы выше',
      'диверсифицировать',
    ]),
    suggestion: randomItem(['демо-счета', 'минимальных лотов', 'бумажного трейдинга', 'изучения риск-менеджмента', 'наблюдения за рынком']),
    example: randomItem(EXAMPLES),
    amount: randomNumber(50, 5000, '', 'M'),
    percent: randomNumber(1, 30, '', '%'),
    network: randomItem(['Ethereum', 'Solana', 'Arbitrum', 'Base', 'Avalanche', 'Optimism', 'Polygon', 'Sui']),
    mint: randomInt(100, 900),
    count: randomInt(10, 100),
    value: randomNumber(0.3, 4, '', '%'),
    trend: randomItem(['падает', 'растет', 'консолидируется', 'пробивает сопротивление', 'отскакивает']),
    response: randomItem(['игнорирует', 'следует корреляции', 'отстает', 'опережает', 'реагирует с задержкой']),
    correlation: randomNumber(0.3, 0.9, '', ''),
    probability: randomInt(25, 85),
    month: randomItem(['июня', 'июля', 'августа', 'сентября', 'октября']),
    plan: randomItem(['жду снижения ставки', 'накапливаю BTC/ETH', 'держу стейблы', 'увеличиваю риск', 'диверсифицирую в альты', 'выхожу в кэш']),
    support: `$${randomInt(20000, 100000)}`,
    breaking: randomItem(['BTC падает на 3%', 'ETH обновляет локальный максимум', 'SOL поднимается на 5%', 'SEC анонсирует решение', 'крупный взлом', 'институциональный приток $500M']),
    comment: randomItem(['ожидал', 'неожиданно', 'в тренде', 'игнорируем', 'внимание']),
    coin: randomItem(['PEPE', 'WIF', 'BONK', 'DOGE', 'SHIB', 'FLOKI', 'BRETT', 'MOODENG', 'POPCAT', 'MOG']),
    coin2: coin2,
    range: `$${randomInt(10, 100)}-$${randomInt(110, 350)}`,
    percent_meme: randomInt(15, 85),
    reason_meme: randomItem(['социалка взлетела', 'кит зашел на $1M+', 'деген комьюнити спамит', 'листинг на DEX', 'тренд в твиттере', 'нарратив сменился']),
    risk: randomItem(['1-2% портфеля', '3-5% лимитки', 'мелкая позиция', 'шорт-терм', 'риск-капитал']),
    condition: randomItem(['объема', 'BTC вверх', 'хайпа в твиттере', 'накала страстей', 'ликвидности', 'поддержки рынка']),
    new_coin: randomItem(['PEPE2.0', 'WIF2', 'DOGEKILLER', 'MOONBAG', 'PUMPKIN', 'CULT', 'HYPE']),
    protocol: randomItem(['Uniswap', 'Jupiter', 'Aave', 'Lido', 'EigenLayer', 'Hyperliquid', 'Pendle', 'Ethena']),
    feature: randomItem(['v4 апгрейд', 'новый пул ликвидности', 'снижение комиссий', 'кроссчейн мост', 'стейкинг 2.0', 'автоматический ребаланс']),
    impact_tech: randomItem(['TVL +15% ожидаем', 'транзакции вырастут', 'юзеры вернутся', 'конкуренты отстают', 'эффективность +20%']),
    project: randomItem(['zkSync', 'Scroll', 'Linea', 'Blast', 'Mode', 'Manta', 'Starknet']),
    features: randomItem(['низкие комиссии', 'быстрые транзакции', 'открытый код', 'сильное комьюнити', 'безопасность', 'масштабируемость']),
    chain1: randomItem(['Arbitrum', 'Optimism', 'Base', 'zkSync', 'Starknet']),
    chain2: randomItem(['Arbitrum', 'Optimism', 'Base', 'zkSync', 'Starknet']),
    metric: randomItem(['TPS', 'медианной комиссии', 'активных адресов', 'объема DEX', 'TVL', 'количество транзакций']),
    conclusion: randomItem(['лидер не меняется', 'догоняют', 'отрыв растет', 'конкуренция усиливается', 'выбор очевиден']),
    upgrade: randomItem(['Deneb', 'EIP-4844', 'Cancun', 'Fjord', 'Dencun', 'Prague', 'Electra']),
    date: randomItem(['через 2 недели', 'в июне', 'в июле', 'в этом квартале', 'в августе']),
    effect: randomItem(['рост экосистемы', 'снижение комиссий L2', 'увеличение blob-пространства', 'хорошо для роллапов', 'приток ликвидности']),
    community_name: community.name,
    community_handle: community.handle,
    topic: community.topic || 'крипто',
    description: community.description || `обсуждаем ${community.topic || 'крипту'}`,
  };

  let content = fillTemplate(template, context);

  if (Math.random() > 0.7) {
    const tags = [`#${symbol}`, '#crypto', '#altcoins', '#trading', '#BTC', '#DeFi', '#Web3'];
    content += `\n\n${randomItem(tags)} ${randomItem(tags)} ${randomItem(tags)}`;
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
      `Зайти в ${community.name}`,
    ];
    return {
      title: randomItem(titles).slice(0, 120),
      url: `/community/${community.handle}`,
    };
  }
  return undefined;
}

function generateEngagement(allUsernames) {
  const likes = randomInt(0, 28);
  const reposts = Math.random() > 0.82 ? randomInt(1, 6) : 0;
  let comments = undefined;

  if (Math.random() > 0.85) {
    const commentAuthors = [...allUsernames];
    const commentCount = randomInt(1, 3);
    comments = [];
    const commentTexts = [
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
      '🔥',
      'Good analysis.',
      'Same here.',
      'Added to watchlist.',
      'Thanks for sharing!',
      'Спасибо, очень актуально.',
      'Ждем пробоя!',
      'Taking notes 📝',
      'Respect the grind.',
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

function generateJune12_20Posts(communitiesInput = null, userList = null) {
  const allCommunities = communitiesInput && communitiesInput.length > 0
    ? communitiesInput.map(c => ({
        handle: c.handle,
        name: c.name,
        topic: c.topic || c.category || 'крипто',
        description: c.description,
        isPrivate: c.isPrivate || false,
      }))
    : [...NEW_COMMUNITIES];

  const allSymbols = SYMBOLS;

  const posts = [];
  let globalIdx = 0;
  const usedSet = new Set();

  for (const day of DAY_QUOTAS) {
    for (let i = 0; i < day.count; i++) {
      const author = randomItem(ALL_USERNAMES);

      let type;
      const rand = Math.random();
      if (rand < 0.22) type = CONTENT_TYPES.ANALYTICS;
      else if (rand < 0.36) type = CONTENT_TYPES.NEWS;
      else if (rand < 0.48) type = CONTENT_TYPES.PORTFOLIO;
      else if (rand < 0.58) type = CONTENT_TYPES.PSYCHOLOGY;
      else if (rand < 0.68) type = CONTENT_TYPES.ONCHAIN;
      else if (rand < 0.76) type = CONTENT_TYPES.MACRO;
      else if (rand < 0.84) type = CONTENT_TYPES.TECH;
      else if (rand < 0.92) type = CONTENT_TYPES.MEME;
      else type = CONTENT_TYPES.COMMUNITY_CTA;

      let content = generatePostContent(type, allCommunities, allSymbols);
      const community = type === CONTENT_TYPES.COMMUNITY_CTA ? randomItem(allCommunities) : null;
      const linkAttachment = generateLinkAttachment(type, community);

      let key = `${day.date}||${content}${linkAttachment ? `||${linkAttachment.url}` : ''}`;
      if (usedSet.has(key)) {
        content = `${content} (${globalIdx + 1})`;
        key = `${day.date}||${content}${linkAttachment ? `||${linkAttachment.url}` : ''}`;
      }
      usedSet.add(key);

      const eng = generateEngagement(ALL_USERNAMES);

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
  generateJune12_20Posts,
  DAY_QUOTAS,
  ALL_USERNAMES,
  NEW_USERS,
  NEW_COMMUNITIES,
  CONTENT_TYPES,
};