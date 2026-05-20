/**
 * Seed demo users + crypto feed posts for local / staging MongoDB.
 *
 * Usage (from server/):
 *   npm run seed:feed          — create missing posts; refresh createdAt on existing (same content)
 *   npm run seed:feed -- --force — wipe all @seed.mnoonx.dev users/posts and re-insert
 *
 * Dates: publishedAt is DD.MM.YYYY HH:mm (local). createdAt in DB = exactly that moment.
 * Edit publishedAt in this file, then run npm run seed:feed to refresh timestamps.
 *
 * All seed accounts password: SeedDemo2024!
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

const SEED_PASSWORD = 'SeedDemo2024!';

/**
 * @param {string} value DD.MM.YYYY HH:mm (локальное время сервера)
 */
function parsePublishedAt(value) {
  const [datePart, timePart] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/** publishedAt → createdAt (как в файле, без сдвига от Date.now()). */
function createdAtFromPublished(publishedAt) {
  return parsePublishedAt(publishedAt);
}

const USERS = [
  { username: 'cryptoalpha', email: 'cryptoalpha@seed.mnoonx.dev', fullName: 'Crypto Alpha', bio: 'Short-term memecoin & momentum signals. NFA.' },
  { username: 'solwhale_io', email: 'solwhale@seed.mnoonx.dev', fullName: 'SOL Whale', bio: 'Solana ecosystem rotations.' },
  { username: 'defi_chad', email: 'defi_chad@seed.mnoonx.dev', fullName: 'DeFi Chad', bio: 'Perps, TVL, tokenomics threads.' },
  { username: 'btc_oracle_ru', email: 'btc_oracle@seed.mnoonx.dev', fullName: 'BTC Oracle RU', bio: 'Макро + BTC. RU / EN.' },
  { username: 'memecoin_hunter', email: 'memes@seed.mnoonx.dev', fullName: 'Meme Coin Hunter', bio: 'Narrative hunting on SOL & Base.' },
  { username: 'chainscout', email: 'chainscout@seed.mnoonx.dev', fullName: 'Chain Scout', bio: 'L2 fees, bridges, ecosystem map.' },
  { username: 'altseason_io', email: 'altseason@seed.mnoonx.dev', fullName: 'Altseason.io', bio: 'Altcoin breadth dashboards.' },
  { username: 'onchain_anna', email: 'anna@seed.mnoonx.dev', fullName: 'Onchain Anna', bio: 'Flows, reserves, stablecoin mints.' },
  { username: 'perp_master', email: 'perp@seed.mnoonx.dev', fullName: 'Perp Master', bio: 'Funding, OI, liquidations.' },
  { username: 'web3_daily', email: 'daily@seed.mnoonx.dev', fullName: 'Web3 Daily', bio: 'Daily crypto headlines.' },
  { username: 'eth_maxi', email: 'eth_maxi@seed.mnoonx.dev', fullName: 'ETH Maxi', bio: 'ETH/BTC ratio & L2 thesis.' },
  { username: 'layer2_lisa', email: 'lisa@seed.mnoonx.dev', fullName: 'Layer2 Lisa', bio: 'Rollups, blobs, fee markets.' },
  { username: 'macro_mike', email: 'macro@seed.mnoonx.dev', fullName: 'Macro Mike', bio: 'Rates, DXY, risk assets.' },
  { username: 'sol_degen_ru', email: 'degen@seed.mnoonx.dev', fullName: 'SOL Degen RU', bio: 'Мемы и деген на Solana.' },
  { username: 'funding_watcher', email: 'funding@seed.mnoonx.dev', fullName: 'Funding Watcher', bio: 'Perp funding arb notes.' },
  { username: 'stable_sage', email: 'stable@seed.mnoonx.dev', fullName: 'Stable Sage', bio: 'Stables, yields, depeg risk.' },
  { username: 'nft_flipper', email: 'nft@seed.mnoonx.dev', fullName: 'NFT Flipper', bio: 'Collections & floor trends.' },
  { username: 'base_builder', email: 'base@seed.mnoonx.dev', fullName: 'Base Builder', bio: 'Base ecosystem apps & TVL.' },
  { username: 'riven_trades', email: 'riven@seed.mnoonx.dev', fullName: 'Riven Trades', bio: 'Swing trades · BTC & majors · journal only.' },
  { username: 'orbit_eth', email: 'orbit@seed.mnoonx.dev', fullName: 'Orbit ETH', bio: 'Ethereum staking, restaking, LRT flows.' },
  { username: 'nova_macro_ru', email: 'nova@seed.mnoonx.dev', fullName: 'Nova Macro RU', bio: 'Макро и риск. Комментарии на русском.' },
  { username: 'airdrop_ace', email: 'ace@seed.mnoonx.dev', fullName: 'Airdrop Ace', bio: 'Farm checkpoints & eligibility threads.' },
  { username: 'restaking_ray', email: 'ray@seed.mnoonx.dev', fullName: 'Restaking Ray', bio: 'EigenLayer · AVS · points meta.' },
  { username: 'pepe_signals', email: 'pepe@seed.mnoonx.dev', fullName: 'Pepe Signals', bio: 'Meme coin scans — ETH & SOL.' },
  { username: 'arb_alex', email: 'arb@seed.mnoonx.dev', fullName: 'Arb Alex', bio: 'Arbitrum ecosystem & gaming.' },
  { username: 'yield_yuki', email: 'yuki@seed.mnoonx.dev', fullName: 'Yield Yuki', bio: 'Real yield · LP risk · points.' },
  { username: 'volkov_trade', email: 'volkov@seed.mnoonx.dev', fullName: 'Волков Trade', bio: 'Свинг по BTC и мажорам. Дневник сделок на русском.' },
  { username: 'katya_onchain', email: 'katya@seed.mnoonx.dev', fullName: 'Катя Onchain', bio: 'Потоки, резервы бирж, стейблкоины. RU.' },
  { username: 'miner_x_ru', email: 'miner@seed.mnoonx.dev', fullName: 'Miner X RU', bio: 'Майнеры, хешрейт, давление на предложение BTC.' },
  { username: 'luna_defi_ru', email: 'luna@seed.mnoonx.dev', fullName: 'Luna DeFi RU', bio: 'DeFi, доходность, риски смарт-контрактов.' },
  { username: 'chart_master_ru', email: 'chart@seed.mnoonx.dev', fullName: 'Chart Master RU', bio: 'Теханализ и уровни. Без финансовых советов.' },
];

/** @type {{ username: string; content: string; publishedAt: string; likes?: number; reposts?: number; comments?: { by: string; text: string; publishedAt: string }[] }[]} */
const POSTS = [
  {
    username: 'cryptoalpha',
    publishedAt: '19.05.2026 21:02',
    content: '$BONK showing strength again. Local bottom looks in. Target 0.000045–0.000052 over 7–10 days. DYOR',
    likes: 7,
    reposts: 1,
    comments: [
      { by: 'memecoin_hunter', text: 'Watching the same level. Volume picked up last night.', publishedAt: '19.05.2026 19:32' },
      { by: 'pepe_signals', text: 'Same read — keeping size small until daily close confirms.', publishedAt: '19.05.2026 19:50' },
      { by: 'perp_master', text: 'Funding flat — no crowded longs yet. Interesting.', publishedAt: '19.05.2026 20:14' },
    ],
  },
  {
    username: 'cryptoalpha',
    publishedAt: '18.05.2026 21:02',
    content: '$WIF holding 4H support. Lose 1.85 and I cut; hold = range high retest. NFA',
    likes: 4,
    comments: [
      { by: 'solwhale_io', text: 'Same plan here. Tight stop.', publishedAt: '18.05.2026 01:02' },
      { by: 'web3_daily', text: 'Noted — adding to morning watchlist.', publishedAt: '18.05.2026 03:02' },
    ],
  },
  {
    username: 'solwhale_io',
    publishedAt: '19.05.2026 18:02',
    content: 'Rotated 40% from $WIF into $PNUT. Better narrative + community momentum. Watching Solscan volume.',
    likes: 11,
    reposts: 2,
    comments: [
      { by: 'memecoin_hunter', text: 'PNUT socials are loud today, agreed.', publishedAt: '19.05.2026 14:02' },
      { by: 'defi_chad', text: 'Careful on size — liquidity still thin vs WIF.', publishedAt: '19.05.2026 14:32' },
      { by: 'cryptoalpha', text: 'Good rotation. I stayed half/half for now.', publishedAt: '19.05.2026 15:02' },
    ],
  },
  {
    username: 'solwhale_io',
    publishedAt: '17.05.2026 23:02',
    content: 'SOL dominance creeping up. If BTC chops, SOL beta names often wake first.',
    likes: 6,
    reposts: 1,
    comments: [{ by: 'altseason_io', text: 'ETH/BTC still weak though — patience.', publishedAt: '16.05.2026 07:02' }],
  },
  {
    username: 'defi_chad',
    publishedAt: '19.05.2026 15:02',
    content:
      'Deep dive: why Hyperliquid could be the next 10x in perps. TVL, volume, tokenomics, on-chain activity.\n\n1/ Fees down, volume sticky\n2/ Incentives aligned\n3/ Bridge flows up WoW',
    likes: 14,
    reposts: 3,
    comments: [
      { by: 'perp_master', text: 'OI chart matches your point #3.', publishedAt: '19.05.2026 08:02' },
      { by: 'funding_watcher', text: 'Funding on HL still cleaner than most CEX.', publishedAt: '19.05.2026 08:32' },
      { by: 'restaking_ray', text: 'Saved the thread — clean structure, thanks.', publishedAt: '19.05.2026 09:02' },
      { by: 'chainscout', text: 'Would add bridge latency data next.', publishedAt: '19.05.2026 10:02' },
    ],
  },
  {
    username: 'defi_chad',
    publishedAt: '16.05.2026 05:02',
    content: 'Perp DEX wars: who retains users after incentives end? Data beats vibes.',
    likes: 9,
    comments: [
      { by: 'layer2_lisa', text: 'Same question for L2s tbh.', publishedAt: '12.05.2026 16:02' },
      { by: 'web3_daily', text: 'Thread-worthy topic this week.', publishedAt: '12.05.2026 21:02' },
    ],
  },
  {
    username: 'btc_oracle_ru',
    publishedAt: '19.05.2026 20:02',
    content: 'BTC удержал $94k — ликвидации шортов ~$180M. Выше недельного VWAP — сценарий медленного роста жив.',
    likes: 12,
    reposts: 2,
    comments: [
      { by: 'nova_macro_ru', text: 'DXY ослаб — поддерживает сценарий.', publishedAt: '19.05.2026 17:32' },
      { by: 'onchain_anna', text: 'Exchange outflows ticked up too.', publishedAt: '19.05.2026 18:02' },
      { by: 'eth_maxi', text: 'ETH lagging as usual on BTC pumps 😅', publishedAt: '19.05.2026 18:32' },
      { by: 'nova_macro_ru', text: 'Согласен по ликвидациям — объём шортов заметный.', publishedAt: '19.05.2026 19:10' },
    ],
  },
  {
    username: 'btc_oracle_ru',
    publishedAt: '18.05.2026 09:02',
    content: 'Fed speakers this week = volatility. Reduce leverage, widen stops. Spot > perps for most.',
    likes: 5,
    comments: [{ by: 'nova_macro_ru', text: 'Перед событиями — только спот, согласен.', publishedAt: '16.05.2026 22:02' }],
  },
  {
    username: 'memecoin_hunter',
    publishedAt: '19.05.2026 17:02',
    content: 'Dog meta on SOL: $PNUT social velocity +3x in 48h. Entry on pullback to VWAP, not green candles.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'pepe_signals', text: 'Waiting for the pullback — not chasing green.', publishedAt: '19.05.2026 12:02' },
      { by: 'cryptoalpha', text: 'Aligned. No FOMO entries.', publishedAt: '19.05.2026 12:32' },
    ],
  },
  {
    username: 'memecoin_hunter',
    publishedAt: '19.05.2026 07:02',
    content: '$BONK / $WIF ratio compressing — historically precedes rotation.',
    likes: 6,
    comments: [{ by: 'solwhale_io', text: 'Already rotating a bit as per my last post.', publishedAt: '18.05.2026 17:02' }],
  },
  {
    username: 'chainscout',
    publishedAt: '19.05.2026 12:02',
    content: 'Base weekly: txs +12%, median fee $0.002. L2 narrative getting on-chain fuel.',
    likes: 7,
    comments: [
      { by: 'base_builder', text: 'App launches on Base picked up too.', publishedAt: '19.05.2026 02:02' },
      { by: 'layer2_lisa', text: 'Blob usage worth a mention next.', publishedAt: '19.05.2026 03:02' },
    ],
  },
  {
    username: 'chainscout',
    publishedAt: '17.05.2026 01:02',
    content: 'Arbitrum ↔ Base bridge volume spike. Airdrop farmers rotating?',
    likes: 4,
    comments: [{ by: 'altseason_io', text: 'Probably — same wallets I track.', publishedAt: '14.05.2026 08:02' }],
  },
  {
    username: 'altseason_io',
    publishedAt: '19.05.2026 19:02',
    content: 'Altcoin breadth flipped bullish first time in 6 weeks. ETH/BTC lagging — early altseason pattern.',
    likes: 10,
    reposts: 2,
    comments: [
      { by: 'eth_maxi', text: 'ETH/BTC reversal would confirm for me.', publishedAt: '19.05.2026 15:32' },
      { by: 'memecoin_hunter', text: 'Memes leading breadth — classic.', publishedAt: '19.05.2026 16:02' },
    ],
  },
  {
    username: 'altseason_io',
    publishedAt: '15.05.2026 09:02',
    content: 'Altseason is a process, not one green day. Scale out into strength.',
    likes: 5,
    comments: [{ by: 'macro_mike', text: 'Discipline > FOMO. Good reminder.', publishedAt: '11.05.2026 05:02' }],
  },
  {
    username: 'onchain_anna',
    publishedAt: '19.05.2026 14:02',
    content: 'Stablecoin net mint +$1.2B (7d). Exchange BTC balance −8k. Pre-expansion setup — wait for breakout confirm.',
    likes: 9,
    reposts: 1,
    comments: [
      { by: 'stable_sage', text: 'Mint dominated by USDC — risk-on signal.', publishedAt: '19.05.2026 06:02' },
      { by: 'riven_trades', text: 'Tracking the same mint + reserve trend.', publishedAt: '19.05.2026 06:32' },
      { by: 'funding_watcher', text: 'Perps OI not extreme yet. Room to run?', publishedAt: '19.05.2026 07:02' },
    ],
  },
  {
    username: 'onchain_anna',
    publishedAt: '17.05.2026 19:02',
    content: 'Whale moved 2,400 ETH to cold storage. Less sell pressure short-term.',
    likes: 4,
    comments: [{ by: 'eth_maxi', text: 'Bullish for ETH supply shock narrative.', publishedAt: '15.05.2026 19:02' }],
  },
  {
    username: 'perp_master',
    publishedAt: '19.05.2026 16:02',
    content: 'BTC funding neutral, OI elevated. Liq map: magnets $91.5k and $97k. Plan for sweep, not prediction.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'funding_watcher', text: 'Funding flipped twice today — choppy.', publishedAt: '19.05.2026 10:02' },
      { by: 'cryptoalpha', text: 'Waiting for the sweep before size.', publishedAt: '19.05.2026 10:32' },
    ],
  },
  {
    username: 'perp_master',
    publishedAt: '18.05.2026 19:02',
    content: 'Hyperliquid OI ATH while CEX perps flat — migration thesis still on.',
    likes: 6,
    comments: [{ by: 'defi_chad', text: 'Covered this in my HL thread — same read.', publishedAt: '17.05.2026 18:02' }],
  },
  {
    username: 'web3_daily',
    publishedAt: '19.05.2026 22:02',
    content: 'Headlines: BTC ETF inflows 5d straight; SEC staking comment period; SOL DeFi TVL +4% WoW.',
    likes: 13,
    reposts: 2,
    comments: [
      { by: 'macro_mike', text: 'ETF flows driving the tape again.', publishedAt: '19.05.2026 21:08' },
      { by: 'chainscout', text: 'SOL TVL line — which protocols?', publishedAt: '19.05.2026 21:20' },
      { by: 'macro_mike', text: 'Clean roundup — saved for the morning brief.', publishedAt: '19.05.2026 21:32' },
    ],
  },
  {
    username: 'web3_daily',
    publishedAt: '19.05.2026 10:02',
    content: 'SEC delayed one ETH ETF decision — short-term noise. $ETH holds $3.4k.',
    likes: 7,
    comments: [
      { by: 'eth_maxi', text: 'Expected delay. Not bearish.', publishedAt: '18.05.2026 22:02' },
      { by: 'layer2_lisa', text: 'L2 tokens didn’t even flinch.', publishedAt: '18.05.2026 23:02' },
    ],
  },
  {
    username: 'eth_maxi',
    publishedAt: '19.05.2026 08:02',
    content: 'ETH/BTC at range low. If we reclaim 0.038, alt ETH beta usually follows within days.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'altseason_io', text: 'Breadth needs ETH/BTC for full altseason imo.', publishedAt: '18.05.2026 18:02' },
      { by: 'layer2_lisa', text: 'L2s would rip on that reclaim.', publishedAt: '18.05.2026 19:02' },
    ],
  },
  {
    username: 'layer2_lisa',
    publishedAt: '19.05.2026 03:02',
    content: 'Blob fee market quiet post-upgrade. Cheaper L2 txs = more retail activity eventually.',
    likes: 5,
    comments: [{ by: 'base_builder', text: 'Base benefiting most in my tracking.', publishedAt: '18.05.2026 09:02' }],
  },
  {
    username: 'macro_mike',
    publishedAt: '19.05.2026 13:02',
    content: 'DXY rolled over 2%. Historically risk assets get a bid 1–2 weeks later. Watch BTC correlation.',
    likes: 9,
    comments: [
      { by: 'onchain_anna', text: 'On-chain risk appetite ticking up in stables too.', publishedAt: '19.05.2026 04:02' },
      { by: 'stable_sage', text: 'Stables rotating into crypto slowly?', publishedAt: '19.05.2026 04:32' },
    ],
  },
  {
    username: 'sol_degen_ru',
    publishedAt: '19.05.2026 19:02',
    content: 'Солана: мемы тащат, но ликвидность тонкая. Вход только с лимитками, без маркета.',
    likes: 6,
    comments: [
      { by: 'memecoin_hunter', text: 'Facts. Slippage killed me yesterday.', publishedAt: '19.05.2026 15:32' },
      { by: 'solwhale_io', text: 'Limit orders only on illiquid pairs.', publishedAt: '19.05.2026 16:02' },
    ],
  },
  {
    username: 'funding_watcher',
    publishedAt: '19.05.2026 11:02',
    content: 'Negative funding on BTC for 6h — shorts paying longs. Often mean-reverts fast.',
    likes: 5,
    comments: [{ by: 'perp_master', text: 'Not adding until funding normalizes.', publishedAt: '19.05.2026 00:02' }],
  },
  {
    username: 'stable_sage',
    publishedAt: '19.05.2026 05:02',
    content: 'USDC dominance up in stablecoin mcap. Flight to quality within stables.',
    likes: 4,
    comments: [{ by: 'onchain_anna', text: 'Same data in my dashboard.', publishedAt: '18.05.2026 13:02' }],
  },
  {
    username: 'nft_flipper',
    publishedAt: '19.05.2026 01:02',
    content: 'Blue-chip NFT floors flat while memecoins pump. Liquidity rotation is real.',
    likes: 3,
    comments: [{ by: 'memecoin_hunter', text: 'All liquidity in fungibles rn.', publishedAt: '18.05.2026 05:02' }],
  },
  {
    username: 'base_builder',
    publishedAt: '19.05.2026 09:02',
    content: 'New Base DEX crossed $50M TVL in week one. Small but fastest grower in my tracker.',
    likes: 7,
    comments: [
      { by: 'chainscout', text: 'Will add to next weekly.', publishedAt: '18.05.2026 20:02' },
      { by: 'defi_chad', text: 'Token launch or organic?', publishedAt: '18.05.2026 20:32' },
    ],
  },
  {
    username: 'cryptoalpha',
    publishedAt: '17.05.2026 11:02',
    content: 'Weekend plan: less size, wider stops. Memes only on confirmed volume.',
    likes: 3,
    comments: [{ by: 'riven_trades', text: 'Smart. Weekends are liquidity traps.', publishedAt: '15.05.2026 01:02' }],
  },
  {
    username: 'defi_chad',
    publishedAt: '18.05.2026 13:02',
    content: 'Сравнил комиссии HL vs dYdX vs GMX v2 — HL выигрывает на объёме >$50M/день.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'perp_master', text: 'На объёме >$50M/день экономия ощутимая.', publishedAt: '17.05.2026 05:02' },
      { by: 'funding_watcher', text: 'Плюс funding прозрачнее, чем на CEX.', publishedAt: '17.05.2026 06:02' },
      { by: 'nova_macro_ru', text: 'Хорошее сравнение, возьму в заметки.', publishedAt: '17.05.2026 06:30' },
    ],
  },
  {
    username: 'btc_oracle_ru',
    publishedAt: '16.05.2026 00:02',
    content: 'Доминация BTC стабильна. Альты без BTC — слабый сетап для агрессии.',
    likes: 5,
    comments: [
      { by: 'nova_macro_ru', text: 'Жду rollover доминации — пока только BTC.', publishedAt: '12.05.2026 06:02' },
      { by: 'sol_degen_ru', text: 'Согласен, альты без битка — ловушка.', publishedAt: '12.05.2026 07:02' },
    ],
  },
  {
    username: 'web3_daily',
    publishedAt: '18.05.2026 02:02',
    content: 'Asia session: thin books, fakeouts common. EU open is when I size up.',
    likes: 4,
    comments: [{ by: 'perp_master', text: 'Same schedule for years.', publishedAt: '16.05.2026 08:02' }],
  },
  {
    username: 'onchain_anna',
    publishedAt: '16.05.2026 20:02',
    content: 'Miner outflows below 30d avg. Selling pressure easing on BTC supply side.',
    likes: 6,
    comments: [{ by: 'macro_mike', text: 'Miner data matches the softer supply narrative.', publishedAt: '13.05.2026 20:02' }],
  },
  {
    username: 'memecoin_hunter',
    publishedAt: '18.05.2026 15:02',
    content: 'New ticker every day on SOL — 90% rugs. Stick to names with 7d+ holder growth.',
    likes: 5,
    comments: [
      { by: 'pepe_signals', text: 'Learned that lesson the hard way last month 😅', publishedAt: '17.05.2026 09:02' },
      { by: 'cryptoalpha', text: 'Holder chart > hype tweets.', publishedAt: '17.05.2026 10:02' },
    ],
  },
  // —— New accounts & extra posts ——
  {
    username: 'riven_trades',
    publishedAt: '19.05.2026 20:32',
    content: 'BTC 4H: higher low held. Invalidation below $92.8k. Targeting prior range high if volume confirms.',
    likes: 6,
    comments: [
      { by: 'perp_master', text: 'Same invalidation zone on my chart.', publishedAt: '19.05.2026 18:02' },
      { by: 'macro_mike', text: 'Risk-on tape helps this setup.', publishedAt: '19.05.2026 18:40' },
    ],
  },
  {
    username: 'riven_trades',
    publishedAt: '17.05.2026 14:02',
    content: 'Cut one alt loser early — preserved capital for the next BTC swing. Journal > ego.',
    likes: 4,
    comments: [{ by: 'altseason_io', text: 'Sizing discipline is underrated.', publishedAt: '16.05.2026 09:02' }],
  },
  {
    username: 'orbit_eth',
    publishedAt: '19.05.2026 11:32',
    content: 'Restaking points: concentration in top AVSs rising. Diversification still matters before TGE clusters.',
    likes: 7,
    reposts: 1,
    comments: [
      { by: 'restaking_ray', text: 'EigenLayer caps worth re-reading this week.', publishedAt: '19.05.2026 08:02' },
      { by: 'eth_maxi', text: 'ETH beta to restaking narrative still strong.', publishedAt: '19.05.2026 08:45' },
    ],
  },
  {
    username: 'orbit_eth',
    publishedAt: '18.05.2026 06:02',
    content: '$ETH staking yield vs T-bills — spread compressed but on-chain demand sticky.',
    likes: 5,
    comments: [{ by: 'yield_yuki', text: 'Real yield hunters still allocating.', publishedAt: '17.05.2026 20:02' }],
  },
  {
    username: 'nova_macro_ru',
    publishedAt: '19.05.2026 16:32',
    content: 'Индекс доллара: откат от локального хая. Риск-активы обычно откликаются с лагом 5–10 дней.',
    likes: 8,
    comments: [
      { by: 'btc_oracle_ru', text: 'Совпадает с картиной по BTC.', publishedAt: '19.05.2026 12:02' },
      { by: 'sol_degen_ru', text: 'Жду подтверждения на графике, не рано ли.', publishedAt: '19.05.2026 12:40' },
    ],
  },
  {
    username: 'nova_macro_ru',
    publishedAt: '15.05.2026 18:02',
    content: 'Неделя отчётов по инфляции — уменьшаю плечо на всех позициях.',
    likes: 4,
    comments: [{ by: 'btc_oracle_ru', text: 'Тоже спот и малый размер.', publishedAt: '14.05.2026 10:02' }],
  },
  {
    username: 'airdrop_ace',
    publishedAt: '19.05.2026 13:32',
    content: 'Checkpoint reminder: L2 bridge activity still counts for several Q2 campaigns. Batch txs > one-off bridges.',
    likes: 9,
    reposts: 1,
    comments: [
      { by: 'chainscout', text: 'Which L2s still weight volume vs unique days?', publishedAt: '19.05.2026 10:02' },
      { by: 'arb_alex', text: 'Arbitrum quests still live — double-check deadlines.', publishedAt: '19.05.2026 10:30' },
    ],
  },
  {
    username: 'airdrop_ace',
    publishedAt: '16.05.2026 11:02',
    content: 'Sybil filters getting stricter — quality wallets > farm quantity.',
    likes: 6,
    comments: [{ by: 'base_builder', text: 'On-chain history length matters now.', publishedAt: '15.05.2026 08:02' }],
  },
  {
    username: 'restaking_ray',
    publishedAt: '19.05.2026 10:32',
    content: 'AVS launch calendar crowded in June. Points dilution risk if you chase every meta.',
    likes: 7,
    comments: [
      { by: 'orbit_eth', text: 'Picking two AVSs max for my stack.', publishedAt: '19.05.2026 07:02' },
      { by: 'defi_chad', text: 'Tokenomics threads on each before deposit.', publishedAt: '19.05.2026 07:40' },
    ],
  },
  {
    username: 'pepe_signals',
    publishedAt: '19.05.2026 14:32',
    content: '$PEPE holding daily VWAP on ETH — SOL memes louder but ETH beta names basing.',
    likes: 5,
    comments: [
      { by: 'memecoin_hunter', text: 'Watching holder growth on PEPE vs new SOL tickers.', publishedAt: '19.05.2026 11:02' },
      { by: 'cryptoalpha', text: 'ETH meme liquidity still deeper on exits.', publishedAt: '19.05.2026 11:35' },
    ],
  },
  {
    username: 'pepe_signals',
    publishedAt: '18.05.2026 11:02',
    content: 'Scan: top 10 SOL memes by 24h unique buyers — only 3 pass my holder filter.',
    likes: 4,
    comments: [{ by: 'memecoin_hunter', text: 'DMing you — want to compare against my scan.', publishedAt: '17.05.2026 16:02' }],
  },
  {
    username: 'arb_alex',
    publishedAt: '19.05.2026 07:32',
    content: 'Arbitrum gaming cohort: DAU +18% WoW. Tokens lagging — watch for catch-up trade.',
    likes: 6,
    comments: [
      { by: 'chainscout', text: 'Cross-checking with bridge inflows.', publishedAt: '19.05.2026 04:02' },
      { by: 'nft_flipper', text: 'NFT volumes on Arb still quiet though.', publishedAt: '19.05.2026 04:40' },
    ],
  },
  {
    username: 'yield_yuki',
    publishedAt: '19.05.2026 06:32',
    content: 'Stable LP on Base: advertised APY vs realized after IL — spread widening on volatile pairs.',
    likes: 5,
    comments: [
      { by: 'stable_sage', text: 'Stick to stables-only pools for now.', publishedAt: '19.05.2026 02:02' },
      { by: 'base_builder', text: 'New pool incentives distort the headline APY.', publishedAt: '19.05.2026 02:35' },
    ],
  },
  {
    username: 'cryptoalpha',
    publishedAt: '19.05.2026 12:02',
    content: 'Intraday: booked partial on $BONK, runner left. Trail stop under VWAP.',
    likes: 5,
    comments: [{ by: 'solwhale_io', text: 'Same — locked profit on the spike.', publishedAt: '19.05.2026 10:02' }],
  },
  {
    username: 'solwhale_io',
    publishedAt: '19.05.2026 05:02',
    content: 'Jupiter volume share back above 80% on SOL swaps — aggregator moat intact.',
    likes: 6,
    comments: [{ by: 'defi_chad', text: 'Fee switch narrative still the elephant in the room.', publishedAt: '18.05.2026 22:02' }],
  },
  {
    username: 'eth_maxi',
    publishedAt: '18.05.2026 14:02',
    content: 'L2 fees sub-cent on Base & Arb — good for adoption, thin for token burns short-term.',
    likes: 5,
    comments: [
      { by: 'layer2_lisa', text: 'Blob capacity is the real bottleneck later.', publishedAt: '17.05.2026 20:02' },
      { by: 'arb_alex', text: 'Arb still wins on app diversity.', publishedAt: '17.05.2026 21:02' },
    ],
  },
  {
    username: 'web3_daily',
    publishedAt: '17.05.2026 15:02',
    content: 'Weekend wrap: BTC +3.2%, SOL ecosystem memes led alt beta, ETH flat. ETF flows positive Mon–Thu.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'altseason_io', text: 'Breadth improved but ETH/BTC still the gate.', publishedAt: '16.05.2026 10:02' },
      { by: 'macro_mike', text: 'Perfect Monday brief — saved.', publishedAt: '16.05.2026 10:40' },
    ],
  },
  {
    username: 'sol_degen_ru',
    publishedAt: '18.05.2026 12:02',
    content: 'Памп на тонком стакане — половина объёма wash. Не путать с органическим спросом.',
    likes: 5,
    comments: [
      { by: 'nova_macro_ru', text: 'Фильтр по уникальным покупателям — must have.', publishedAt: '17.05.2026 08:02' },
      { by: 'btc_oracle_ru', text: 'На локальном рынке сейчас много wash.', publishedAt: '17.05.2026 08:40' },
    ],
  },
  {
    username: 'funding_watcher',
    publishedAt: '18.05.2026 08:02',
    content: 'Cross-exchange funding arb window on ETH perps — 0.02% spread, watch fees.',
    likes: 4,
    comments: [{ by: 'perp_master', text: 'Gone in minutes last time I tried.', publishedAt: '17.05.2026 18:02' }],
  },
  {
    username: 'nft_flipper',
    publishedAt: '18.05.2026 20:02',
    content: 'Blur daily active bidders up but average sale size down — traders farming points?',
    likes: 3,
    comments: [{ by: 'arb_alex', text: 'Could be Arb gaming overlap wallets.', publishedAt: '17.05.2026 12:02' }],
  },
  {
    username: 'nova_macro_ru',
    publishedAt: '20.05.2026 12:43',
    content: 'CPI на этой неделе — главный катализатор. До публикации: меньше плеча, больше кэша. После — можно пересобрать книгу.',
    likes: 7,
    comments: [
      { by: 'macro_mike', text: 'Same playbook — vol crush then direction.', publishedAt: '20.05.2026 09:02' },
      { by: 'btc_oracle_ru', text: 'Согласен, спот приоритетнее перпов.', publishedAt: '20.05.2026 09:35' },
    ],
  },
  {
    username: 'sol_degen_ru',
    publishedAt: '20.05.2026 10:13',
    content:
      'На SOL снова всплеск новых тикеров. Правило: если за 24ч уникальных покупателей < 800 — не лезу, даже если Twitter шумит.',
    likes: 6,
    reposts: 1,
    comments: [
      { by: 'memecoin_hunter', text: 'Holder filter saves accounts.', publishedAt: '20.05.2026 07:02' },
      { by: 'pepe_signals', text: 'ETH memes quieter but deeper liquidity.', publishedAt: '20.05.2026 07:30' },
    ],
  },
  {
    username: 'volkov_trade',
    publishedAt: '20.05.2026 09:43',
    content: 'Закрыл половину позиции по BTC на локальном хае. Остаток с трейлом — не отдаю прибыль в откате без причины.',
    likes: 5,
    comments: [{ by: 'perp_master', text: 'VWAP trail works on 4H too.', publishedAt: '20.05.2026 06:02' }],
  },
  {
    username: 'katya_onchain',
    publishedAt: '20.05.2026 08:13',
    content:
      'Стейблы: чистый приток в USDC за 7 дней +$1.2B. Это не гарантия пампа, но ликвидность в системе растёт — следим за альтами с лагом.',
    likes: 8,
    comments: [
      { by: 'onchain_anna', text: 'Matches my exchange reserve chart.', publishedAt: '20.05.2026 04:02' },
      { by: 'stable_sage', text: 'Yield on stables still compressed though.', publishedAt: '20.05.2026 04:40' },
    ],
  },
  {
    username: 'miner_x_ru',
    publishedAt: '19.05.2026 22:02',
    content: 'Хешрейт BTC на историческом максимуме, оттоки с бирж майнеров ниже среднего — давление продаж со стороны supply смягчается.',
    likes: 6,
    comments: [{ by: 'btc_oracle_ru', text: 'Согласую с картиной по $94k.', publishedAt: '19.05.2026 19:02' }],
  },
  {
    username: 'luna_defi_ru',
    publishedAt: '19.05.2026 20:32',
    content:
      'Сравнил три L2 по комиссиям и TVL: Base лидирует по активности, Arbitrum — по экосистеме приложений. Выбор сети = выбор риска контрагента.',
    likes: 7,
    reposts: 1,
    comments: [
      { by: 'layer2_lisa', text: 'Blob fees still the long-term variable.', publishedAt: '19.05.2026 17:02' },
      { by: 'base_builder', text: 'Base consumer apps pulling new wallets.', publishedAt: '19.05.2026 17:35' },
    ],
  },
  {
    username: 'chart_master_ru',
    publishedAt: '19.05.2026 18:02',
    content: 'ETH/BTC: тест сопротивления 0.032. Пробой + закрепление дневного закрытия = сигнал для альт-сезона. Пока — осторожность.',
    likes: 10,
    reposts: 2,
    comments: [
      { by: 'eth_maxi', text: 'Been waiting for this level for weeks.', publishedAt: '19.05.2026 14:02' },
      { by: 'altseason_io', text: 'Breadth not confirming yet on my dashboard.', publishedAt: '19.05.2026 14:40' },
      { by: 'nova_macro_ru', text: 'Жду подтверждения объёмом, не только ценой.', publishedAt: '19.05.2026 15:10' },
    ],
  },
  {
    username: 'defi_chad',
    publishedAt: '19.05.2026 16:32',
    content:
      'Коротко по перп-DEX: объём есть, удержание пользователей после инсентивов — вот где рынок отбирает победителей. Смотрю retention, не только TVL.',
    likes: 8,
    comments: [
      { by: 'perp_master', text: 'OI stickiness chart incoming on my side.', publishedAt: '19.05.2026 12:02' },
      { by: 'luna_defi_ru', text: 'Retention важнее headline APY — согласна.', publishedAt: '19.05.2026 12:35' },
    ],
  },
  {
    username: 'onchain_anna',
    publishedAt: '19.05.2026 15:02',
    content: 'Крупный кошелёк перевёл 12k ETH на cold storage — не биржа, не мост. Такие потоки обычно нейтрально-позитивны для спота.',
    likes: 9,
    comments: [{ by: 'katya_onchain', text: 'Вижу тот же кластер в Nansen.', publishedAt: '19.05.2026 11:02' }],
  },
  {
    username: 'perp_master',
    publishedAt: '19.05.2026 13:32',
    content: 'Funding на BTC перпах слегка отрицательный — шорты платят лонгам. Не перегрев лонгов, но и нет squeeze setup без катализатора.',
    likes: 5,
    comments: [{ by: 'funding_watcher', text: 'Spread vs Binance still tiny.', publishedAt: '19.05.2026 10:02' }],
  },
  {
    username: 'macro_mike',
    publishedAt: '19.05.2026 11:02',
    content: 'Доходности 10Y откатились от локального пика — риск-активы дышат легче. Крипта часто реагирует с опережением на 1–2 сессии.',
    likes: 6,
    comments: [{ by: 'nova_macro_ru', text: 'Лаг 5–10 дней тоже бывает — не гонимся.', publishedAt: '19.05.2026 08:02' }],
  },
  {
    username: 'stable_sage',
    publishedAt: '19.05.2026 09:32',
    content: 'USDe peg стабилен, но доходность сжалась — охота за yield уехала в L2 LP. Проверяйте IL и аудит пула, не только APY в заголовке.',
    likes: 7,
    comments: [{ by: 'yield_yuki', text: 'Stables-only pools for sleep.', publishedAt: '19.05.2026 06:02' }],
  },
  {
    username: 'solwhale_io',
    publishedAt: '19.05.2026 07:02',
    content: 'SOL удерживает $148 — экосистемные мемы тянут бета. Если BTC не ломает неделю, ротация в SOL-names логична.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'sol_degen_ru', text: 'Согласен, но размер — крошечный на новых тикерах.', publishedAt: '19.05.2026 04:02' },
      { by: 'cryptoalpha', text: 'Watching same level on SOL/BTC.', publishedAt: '19.05.2026 04:30' },
    ],
  },
  {
    username: 'memecoin_hunter',
    publishedAt: '18.05.2026 23:02',
    content: 'Нарратив «AI + мем» на Base выдыхается — держатели падают третий день подряд. Ротация обратно в SOL лидеров.',
    likes: 5,
    comments: [{ by: 'base_builder', text: 'Base still wins on app installs though.', publishedAt: '18.05.2026 19:02' }],
  },
  {
    username: 'eth_maxi',
    publishedAt: '18.05.2026 21:32',
    content: 'Стейкинг ETH: доходность ~3.2%, LRT мета тихая. Фокус на L2 adoption — без пользователей токен не едет, сколько ни говори про флури.',
    likes: 6,
    comments: [{ by: 'orbit_eth', text: 'Restaking points dilution is real.', publishedAt: '18.05.2026 17:02' }],
  },
  {
    username: 'volkov_trade',
    publishedAt: '18.05.2026 19:02',
    content: 'Убыток по одному альту — минус 4%, стоп сработал. В плюсе неделя за счёт BTC. Дневник: эмоции выключены, правила включены.',
    likes: 4,
    comments: [
      { by: 'chart_master_ru', text: 'Журнал важнее одной сделки — верно.', publishedAt: '18.05.2026 15:02' },
      { by: 'riven_trades', text: 'Same — one bad alt, BTC saved the week.', publishedAt: '18.05.2026 15:40' },
    ],
  },
  {
    username: 'katya_onchain',
    publishedAt: '18.05.2026 17:32',
    content: 'Биржевые резервы BTC −2.1% за 14 дней — монеты уходят с площадок. Не бычий сигнал сам по себе, но фон укрепляется.',
    likes: 7,
    comments: [{ by: 'miner_x_ru', text: 'Стыкуется с данными по майнерам.', publishedAt: '18.05.2026 13:02' }],
  },
  {
    username: 'luna_defi_ru',
    publishedAt: '18.05.2026 14:02',
    content: 'Новый пул на Base с 400% APY — 90% инсентив, 10% комиссии. Реализованная доходность за 3 дня: ~12%. Читайте мелкий шрифт.',
    likes: 11,
    reposts: 2,
    comments: [
      { by: 'yield_yuki', text: 'Incentives mask IL every time.', publishedAt: '18.05.2026 10:02' },
      { by: 'defi_chad', text: 'Realized vs advertised — key metric.', publishedAt: '18.05.2026 10:35' },
    ],
  },
  {
    username: 'chart_master_ru',
    publishedAt: '18.05.2026 11:32',
    content: 'Дневка SOL: двойное дно на $142, цель $158 при пробое $150. Инвалидация — закрытие ниже $138.',
    likes: 6,
    comments: [{ by: 'solwhale_io', text: 'Same levels on my chart.', publishedAt: '18.05.2026 08:02' }],
  },
  {
    username: 'funding_watcher',
    publishedAt: '18.05.2026 09:02',
    content: 'Арбитраж funding ETH между CEX и DEX: спред 0.015% — после комиссий почти ноль. Окно закрылось за 8 минут.',
    likes: 3,
    comments: [{ by: 'perp_master', text: 'HFT eats those instantly.', publishedAt: '18.05.2026 06:02' }],
  },
  {
    username: 'web3_daily',
    publishedAt: '17.05.2026 22:02',
    content:
      'Итоги дня: BTC +1.8%, ETH +0.4%, SOL +2.9%. Лидеры — мемы на Solana. Завтра — заседания ФР, волатильность с 15:30 МСК.',
    likes: 12,
    reposts: 2,
    comments: [
      { by: 'nova_macro_ru', text: 'Спасибо за краткий бриф.', publishedAt: '17.05.2026 18:02' },
      { by: 'btc_oracle_ru', text: 'Волатильность после ФР — классика.', publishedAt: '17.05.2026 18:40' },
      { by: 'altseason_io', text: 'ETH/BTC still the gate for alts.', publishedAt: '17.05.2026 19:10' },
    ],
  },
];

function buildComments(specComments, userMap) {
  if (!specComments?.length) return [];
  return specComments
    .map((c) => {
      const author = userMap.get(c.by);
      if (!author) return null;
      const createdAt = createdAtFromPublished(c.publishedAt);
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

async function ensureUser(def) {
  let user = await User.findOne({ username: def.username });
  if (user) return user;

  user = new User({
    username: def.username,
    email: def.email,
    password: SEED_PASSWORD,
    fullName: def.fullName,
    bio: def.bio,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(def.fullName)}&background=111827&color=fff&size=128&bold=true`,
  });
  await user.save();
  console.log(`  + user @${def.username}`);
  return user;
}

async function clearSeedData() {
  const users = await User.find({ email: /@seed\.mnoonx\.dev$/i }).select('_id username');
  const ids = users.map((u) => u._id.toString());
  if (ids.length === 0) {
    console.log('No prior seed users found.');
    return;
  }
  const deletedPosts = await Post.deleteMany({ author: { $in: ids } });
  await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
  console.log(`Removed ${users.length} seed users, ${deletedPosts.deletedCount} posts.`);
}

async function refreshPostTimestamps(authorId, spec, userMap) {
  const createdAt = createdAtFromPublished(spec.publishedAt);
  const commentDocs = buildComments(spec.comments, userMap);
  const commentsCount = commentDocs.length;
  await Post.updateOne(
    { author: authorId.toString(), content: spec.content },
    {
      $set: {
        createdAt,
        updatedAt: createdAt,
        comments: commentDocs,
        commentsCount,
      },
    }
  );
}

async function createPost(authorId, spec, userMap) {
  const createdAt = createdAtFromPublished(spec.publishedAt);
  const commentDocs = buildComments(spec.comments, userMap);
  const commentsCount = commentDocs.length;

  const post = new Post({
    author: authorId.toString(),
    content: spec.content,
    media: [],
    likes: [],
    likesCount: spec.likes ?? 0,
    reposts: [],
    repostsCount: spec.reposts ?? 0,
    comments: commentDocs,
    commentsCount,
    viewsCount: Math.floor((spec.likes ?? 0) * 3 + commentsCount * 2 + 8),
    isPrivate: false,
  });

  post.createdAt = createdAt;
  post.updatedAt = createdAt;
  await post.save({ timestamps: false });
}

async function main() {
  const force = process.argv.includes('--force');

  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  console.log(`  Clock now: ${new Date().toLocaleString('ru-RU')} (createdAt = publishedAt from file)`);

  if (force) {
    await clearSeedData();
  }

  const userMap = new Map();
  for (const def of USERS) {
    const user = await ensureUser(def);
    userMap.set(def.username, user);
  }

  let created = 0;
  let refreshed = 0;
  let totalComments = 0;

  for (const spec of POSTS) {
    const user = userMap.get(spec.username);
    if (!user) continue;

    const exists = await Post.findOne({
      author: user._id.toString(),
      content: spec.content,
    });
    if (exists && !force) {
      await refreshPostTimestamps(user._id, spec, userMap);
      totalComments += spec.comments?.length ?? 0;
      refreshed += 1;
      continue;
    }
    if (exists && force) {
      await Post.deleteOne({ _id: exists._id });
    }

    await createPost(user._id, spec, userMap);
    totalComments += spec.comments?.length ?? 0;
    created += 1;
  }

  for (const user of userMap.values()) {
    const count = await Post.countDocuments({ author: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { postsCount: count });
  }

  console.log('\nDone.');
  console.log(`  Users: ${userMap.size}`);
  console.log(`  Posts created: ${created}`);
  console.log(`  Posts timestamps refreshed: ${refreshed}`);
  console.log(`  Template comments: ${totalComments}`);
  console.log(`\n  Password: ${SEED_PASSWORD}`);
  console.log('  Example: cryptoalpha@seed.mnoonx.dev / @cryptoalpha\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
