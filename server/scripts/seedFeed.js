/**
 * Seed demo users + crypto feed posts for local / staging MongoDB.
 *
 * Usage (from server/):
 *   npm run seed:feed
 *   npm run seed:feed -- --force
 *
 * All seed accounts password: SeedDemo2024!
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');

const SEED_PASSWORD = 'SeedDemo2024!';

/** «Сейчас» на момент составления ленты — от него считается сдвиг при сиде. */
const SEED_REFERENCE_NOW = new Date(2026, 4, 19, 23, 2, 0);

/**
 * @param {string} value DD.MM.YYYY HH:mm (локальное время сервера)
 */
function parsePublishedAt(value) {
  const [datePart, timePart] = value.trim().split(/\s+/);
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/** Заданное время публикации → createdAt относительно реального Date.now(). */
function createdAtFromPublished(publishedAt) {
  const anchorMs = SEED_REFERENCE_NOW.getTime();
  const publishedMs = parsePublishedAt(publishedAt).getTime();
  return new Date(Date.now() - (anchorMs - publishedMs));
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
      { by: 'sol_degen_ru', text: 'Согласен, но размер маленький пока.', publishedAt: '19.05.2026 19:50' },
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
      { by: 'btc_oracle_ru', text: 'Сохранил тред, спасибо за структуру.', publishedAt: '19.05.2026 09:02' },
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
      { by: 'macro_mike', text: 'DXY cooled — helps this thesis.', publishedAt: '19.05.2026 17:32' },
      { by: 'onchain_anna', text: 'Exchange outflows ticked up too.', publishedAt: '19.05.2026 18:02' },
      { by: 'eth_maxi', text: 'ETH lagging as usual on BTC pumps 😅', publishedAt: '19.05.2026 18:32' },
    ],
  },
  {
    username: 'btc_oracle_ru',
    publishedAt: '18.05.2026 09:02',
    content: 'Fed speakers this week = volatility. Reduce leverage, widen stops. Spot > perps for most.',
    likes: 5,
    comments: [{ by: 'stable_sage', text: 'Risk-off into events — wise.', publishedAt: '16.05.2026 22:02' }],
  },
  {
    username: 'memecoin_hunter',
    publishedAt: '19.05.2026 17:02',
    content: 'Dog meta on SOL: $PNUT social velocity +3x in 48h. Entry on pullback to VWAP, not green candles.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'sol_degen_ru', text: 'Жду откат, не гонюсь.', publishedAt: '19.05.2026 12:02' },
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
      { by: 'btc_oracle_ru', text: 'Слежу за тем же.', publishedAt: '19.05.2026 06:32' },
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
      { by: 'btc_oracle_ru', text: 'Кратко и по делу, спасибо.', publishedAt: '19.05.2026 21:32' },
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
      { by: 'btc_oracle_ru', text: 'Макро совпадает с ончейн.', publishedAt: '19.05.2026 04:02' },
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
    comments: [{ by: 'sol_degen_ru', text: 'Умно. Выходные — ловушки.', publishedAt: '15.05.2026 01:02' }],
  },
  {
    username: 'defi_chad',
    publishedAt: '18.05.2026 13:02',
    content: 'Сравнил комиссии HL vs dYdX vs GMX v2 — HL выигрывает на объёме >$50M/день.',
    likes: 8,
    reposts: 1,
    comments: [
      { by: 'perp_master', text: 'Fee savings add up for active traders.', publishedAt: '17.05.2026 05:02' },
      { by: 'funding_watcher', text: 'Plus better funding transparency.', publishedAt: '17.05.2026 06:02' },
    ],
  },
  {
    username: 'btc_oracle_ru',
    publishedAt: '16.05.2026 00:02',
    content: 'Доминация BTC стабильна. Альты без BTC — слабый сетап для агрессии.',
    likes: 5,
    comments: [{ by: 'altseason_io', text: 'Waiting for dominance rollover.', publishedAt: '12.05.2026 06:02' }],
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
    comments: [{ by: 'btc_oracle_ru', text: 'Подтверждаю по Glassnode.', publishedAt: '13.05.2026 20:02' }],
  },
  {
    username: 'memecoin_hunter',
    publishedAt: '18.05.2026 15:02',
    content: 'New ticker every day on SOL — 90% rugs. Stick to names with 7d+ holder growth.',
    likes: 5,
    comments: [
      { by: 'sol_degen_ru', text: 'Уроками учимся дорого 😅', publishedAt: '17.05.2026 09:02' },
      { by: 'cryptoalpha', text: 'Holder chart > hype tweets.', publishedAt: '17.05.2026 10:02' },
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
  console.log(
    `  Reference "now": ${SEED_REFERENCE_NOW.toLocaleString('ru-RU')} → createdAt offset from real now`
  );

  if (force) {
    await clearSeedData();
  }

  const userMap = new Map();
  for (const def of USERS) {
    const user = await ensureUser(def);
    userMap.set(def.username, user);
  }

  let created = 0;
  let skipped = 0;
  let totalComments = 0;

  for (const spec of POSTS) {
    const user = userMap.get(spec.username);
    if (!user) continue;

    const exists = await Post.findOne({
      author: user._id.toString(),
      content: spec.content,
    });
    if (exists && !force) {
      skipped += 1;
      continue;
    }
    if (exists && force) {
      await Post.deleteOne({ _id: exists._id });
    }

    await createPost(user._id, spec, userMap);
    totalComments += (spec.comments?.length ?? 0);
    created += 1;
  }

  for (const user of userMap.values()) {
    const count = await Post.countDocuments({ author: user._id.toString() });
    await User.findByIdAndUpdate(user._id, { postsCount: count });
  }

  console.log('\nDone.');
  console.log(`  Users: ${userMap.size}`);
  console.log(`  Posts created: ${created}`);
  console.log(`  Template comments: ${totalComments}`);
  if (skipped) console.log(`  Posts skipped (already exist): ${skipped}`);
  console.log(`\n  Password: ${SEED_PASSWORD}`);
  console.log('  Example: cryptoalpha@seed.mnoonx.dev / @cryptoalpha\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
