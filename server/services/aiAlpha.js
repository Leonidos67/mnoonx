const coingecko = require('./coingecko');
const gemini = require('./gemini');
const { buildCoinAnalysisTemplate } = require('./coinAnalysisTemplate');

const DISCLAIMER = 'This is not financial advice. AI output can be wrong. Always DYOR.';

const ALPHA_SYSTEM = `You are AI Alpha — the focused crypto intelligence persona for MNOONX.

Rules:
- Give clear, structured analysis in Markdown (## headings, bullet lists, **bold** for key levels and risks).
- Cover: what the asset/query is, market context, momentum, liquidity/rug risks, and a concise recommendation.
- Use a direct, confident tone but never guarantee returns or certainty.
- If data is missing, say so and explain what to verify on-chain.
- Keep main answers under ~400 words unless the user asks for depth.
- Always remind readers this is opinion, not financial advice.`;

const PULSE_SYSTEM = `You are AI Alpha broadcasting a live market "pulse" for crypto traders.

Reply with EXACTLY two lines:
SENTIMENT: bullish|neutral|bearish
TEXT: 2-4 short sentences about what matters right now in crypto (majors, narratives, risks). Be specific, vivid, and current-feeling. No markdown.`;

const pulseCache = { text: null, sentiment: null, ts: 0 };
const PULSE_CACHE_MS = 90 * 1000;

function extractTickerHint(message) {
  if (!message || typeof message !== 'string') return null;
  const trimmed = message.trim();
  const dollar = trimmed.match(/\$([A-Za-z0-9]{2,12})\b/);
  if (dollar) return dollar[1].toUpperCase();
  const analyze = trimmed.match(/(?:analyze|analysis|check|review)\s+([A-Za-z0-9]{2,12})\b/i);
  if (analyze) return analyze[1].toUpperCase();
  if (/^0x[a-fA-F0-9]{40}$/.test(trimmed)) return trimmed;
  if (/^[A-Za-z0-9]{2,12}$/.test(trimmed)) return trimmed.toUpperCase();
  return null;
}

async function buildMarketContext(message) {
  const hint = extractTickerHint(message);
  if (!hint) return '';

  try {
    if (hint.startsWith('0x')) {
      return `\n\nUser referenced contract address: ${hint}. Treat as a token CA; stress verification, liquidity, holder distribution, and honeypot risk.`;
    }

    const search = await coingecko.searchCoins(hint);
    const top = (search.coins || [])[0];
    if (!top) return `\n\nNo CoinGecko match for "${hint}". Note limited public market data.`;

    const detail = await coingecko.getCoinById(top.id);
    const mapped = coingecko.mapCoinDetail(detail);
    return `

Reference market data (CoinGecko, may be delayed):
- Asset: ${mapped.name} (${mapped.symbol})
- Price: ${mapped.current_price ?? 'n/a'} USD
- 24h change: ${mapped.price_change_percentage_24h ?? 'n/a'}%
- Market cap rank: ${mapped.market_cap_rank ?? 'n/a'}
- 24h volume: ${mapped.total_volume ?? 'n/a'}
- 24h range: ${mapped.low_24h ?? 'n/a'} – ${mapped.high_24h ?? 'n/a'}`;
  } catch {
    return '';
  }
}

function parsePulseResponse(raw) {
  const text = String(raw || '');
  const sentimentMatch = text.match(/SENTIMENT:\s*(bullish|neutral|bearish)/i);
  const textMatch = text.match(/TEXT:\s*([\s\S]+)/i);

  let sentiment = 'neutral';
  if (sentimentMatch) {
    const s = sentimentMatch[1].toLowerCase();
    if (s === 'bullish' || s === 'bearish') sentiment = s;
  }

  let pulseText = textMatch ? textMatch[1].trim() : text.replace(/SENTIMENT:.*/i, '').trim();
  if (!pulseText) pulseText = 'Markets are active — stay selective and manage risk.';

  return { text: pulseText, sentiment };
}

const COIN_ENRICH_SYSTEM = `You are AI Alpha for MNOONX — a crypto intelligence assistant.

The user receives a pre-filled market snapshot with exact numbers from CoinGecko. Your job is to ADD new sections using publicly available web information (news, ecosystem updates, narratives, regulatory context).

Rules:
- Write in the language requested (Russian or English).
- Do NOT change, reformat, or repeat the snapshot numbers — only append new sections after it.
- Add exactly these Markdown sections:
  ## Recent developments
  ## Market context & outlook
  ## Key risks to watch
- In Recent developments, cite 2–4 recent public sources briefly (outlet or topic, not long URLs).
- Be specific to the asset; if little recent news exists, say so honestly.
- Keep the full addition under ~350 words.
- No price predictions or guaranteed outcomes.`;

async function runCoinAnalyze({ message, coinContext, locale = 'en' }) {
  const userMessage = String(message || '').trim();
  if (!coinContext || typeof coinContext !== 'object') {
    const err = new Error('Coin context is required');
    err.status = 400;
    throw err;
  }

  const lang = locale === 'ru' ? 'ru' : 'en';
  const baseTemplate = buildCoinAnalysisTemplate(coinContext, lang);
  const assetLabel = `${coinContext.name} (${String(coinContext.symbol || '').toUpperCase()})`;
  const langLabel = lang === 'ru' ? 'Russian' : 'English';

  const enrichPrompt = `User request: ${userMessage || `Analyze ${assetLabel}`}

Pre-filled snapshot (keep these numbers unchanged — do not repeat this block in your reply):
---
${baseTemplate}
---

Using open public web sources, append the three sections listed in your instructions for ${assetLabel}.
Write in ${langLabel}. Return ONLY the three new sections (## Recent developments, ## Market context & outlook, ## Key risks to watch).`;

  let enrichment = '';
  try {
    enrichment = await gemini.chatCompletion({
      messages: [
        { role: 'system', content: COIN_ENRICH_SYSTEM },
        { role: 'user', content: enrichPrompt },
      ],
      maxTokens: 1200,
      temperature: 0.65,
      useGoogleSearch: true,
    });
  } catch (searchErr) {
    console.warn('Coin analyze: Google Search enrichment failed, falling back', searchErr.message);
    try {
      enrichment = await gemini.chatCompletion({
        messages: [
          { role: 'system', content: COIN_ENRICH_SYSTEM },
          {
            role: 'user',
            content: `${enrichPrompt}\n\n(Web search unavailable — use general public knowledge and note that live news could not be fetched.)`,
          },
        ],
        maxTokens: 1000,
        temperature: 0.6,
        useGoogleSearch: false,
      });
    } catch (fallbackErr) {
      console.warn('Coin analyze: enrichment unavailable, returning snapshot only', fallbackErr.message);
      enrichment = '';
    }
  }

  const disclaimer =
    lang === 'ru'
      ? 'Не является финансовой рекомендацией. Ответ AI может содержать ошибки. Всегда проводите собственное исследование.'
      : DISCLAIMER;

  const reply = enrichment.trim()
    ? `${baseTemplate}\n\n${enrichment.trim()}\n\n_${disclaimer}_`
    : `${baseTemplate}\n\n_${disclaimer}_`;
  return { reply, disclaimer };
}

async function runChat({ message, mode = 'analyze', previousResponse, coinContext, locale }) {
  if (mode === 'coin_analyze') {
    return runCoinAnalyze({ message, coinContext, locale });
  }

  const userMessage = String(message || '').trim();
  if (!userMessage && mode !== 'rewrite') {
    const err = new Error('Message is required');
    err.status = 400;
    throw err;
  }

  const marketContext = mode === 'analyze' ? await buildMarketContext(userMessage) : '';

  let userContent = userMessage;
  if (mode === 'rewrite') {
    if (!previousResponse) {
      const err = new Error('Previous response is required to rewrite');
      err.status = 400;
      throw err;
    }
    userContent = `Rewrite your previous analysis with the same facts but a sharper, more readable structure. User tweak request: "${userMessage || 'make it clearer and more actionable'}".

Previous analysis:
---
${previousResponse}
---`;
  } else {
    userContent = `${userMessage}${marketContext}`;
  }

  const reply = await gemini.chatCompletion({
    messages: [
      { role: 'system', content: ALPHA_SYSTEM },
      { role: 'user', content: userContent },
    ],
    maxTokens: mode === 'rewrite' ? 1000 : 1400,
    temperature: mode === 'rewrite' ? 0.55 : 0.7,
  });

  return { reply, disclaimer: DISCLAIMER };
}

async function runPulse() {
  const now = Date.now();
  if (pulseCache.text && now - pulseCache.ts < PULSE_CACHE_MS) {
    return {
      text: pulseCache.text,
      sentiment: pulseCache.sentiment,
      disclaimer: DISCLAIMER,
    };
  }

  let marketSnippet = '';
  try {
    const markets = await coingecko.getMarkets({ per_page: 5 });
    marketSnippet = markets
      .slice(0, 5)
      .map(
        (c) =>
          `${c.symbol?.toUpperCase()}: ${c.current_price} USD (${(c.price_change_percentage_24h ?? 0).toFixed(1)}% 24h)`
      )
      .join('; ');
  } catch {
    marketSnippet = 'Market data temporarily unavailable.';
  }

  const raw = await gemini.chatCompletion({
    messages: [
      { role: 'system', content: PULSE_SYSTEM },
      {
        role: 'user',
        content: `Current top-market snapshot: ${marketSnippet}. Give the live pulse now.`,
      },
    ],
    maxTokens: 180,
    temperature: 0.85,
  });

  const parsed = parsePulseResponse(raw);
  pulseCache.text = parsed.text;
  pulseCache.sentiment = parsed.sentiment;
  pulseCache.ts = now;

  return { ...parsed, disclaimer: DISCLAIMER };
}

module.exports = {
  runChat,
  runCoinAnalyze,
  runPulse,
  DISCLAIMER,
};
