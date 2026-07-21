const gemini = require('./gemini');

const OPENAI_BASE = 'https://api.openai.com/v1';

function maskApiKey(key) {
  const s = String(key || '').trim();
  if (!s) return { hasApiKey: false, apiKeyLast4: '' };
  return { hasApiKey: true, apiKeyLast4: s.slice(-4) };
}

async function generateWithOpenAI({ apiKey, model, system, user, maxTokens, temperature }) {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 1024,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const raw = data?.error?.message || data?.message || `OpenAI request failed (${res.status})`;
    const err = new Error(raw);
    err.status = res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status;
    throw err;
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text || !String(text).trim()) {
    const err = new Error('Empty response from OpenAI');
    err.status = 502;
    throw err;
  }
  return String(text).trim();
}

/**
 * @param {{
 *   provider: 'gemini'|'openai',
 *   apiKey: string,
 *   model?: string,
 *   system?: string,
 *   user: string,
 *   maxTokens?: number,
 *   temperature?: number,
 * }} opts
 */
async function generateCommunityAiText(opts) {
  const apiKey = String(opts.apiKey || '').trim();
  if (!apiKey) {
    const err = new Error('API key is not configured for this Community AI app');
    err.status = 400;
    throw err;
  }
  const provider = opts.provider === 'openai' ? 'openai' : 'gemini';
  if (provider === 'openai') {
    return generateWithOpenAI({
      apiKey,
      model: opts.model,
      system: opts.system,
      user: opts.user,
      maxTokens: opts.maxTokens,
      temperature: opts.temperature,
    });
  }
  return gemini.generateText({
    apiKey,
    system: opts.system,
    user: opts.user,
    maxTokens: opts.maxTokens,
    temperature: opts.temperature,
    model: opts.model,
  });
}

function buildSystemPrompt(config, communityName) {
  const parts = [
    String(config.systemPrompt || '').trim() ||
      'You are a helpful community assistant.',
    `Community name: ${communityName || 'Community'}.`,
    `Your display name: ${config.botName || 'Community AI'}.`,
  ];
  if (config.responseLanguage && config.responseLanguage !== 'auto') {
    parts.push(`Respond in this language: ${config.responseLanguage}.`);
  }
  return parts.join('\n');
}

function normalizeOnboardingSteps(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw.slice(0, 12)) {
    if (!item || typeof item !== 'object') continue;
    const title = String(item.title || '').trim().slice(0, 120);
    if (!title) continue;
    const id =
      String(item.id || '')
        .trim()
        .slice(0, 40) || `step_${out.length + 1}`;
    out.push({
      id,
      title,
      description: String(item.description || '')
        .trim()
        .slice(0, 400),
    });
  }
  return out;
}

function serializeConfig(doc, { includeSecrets = false } = {}) {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject({ getters: false }) : { ...doc };
  const key = plain.apiKey || '';
  const masked = maskApiKey(key);
  const out = {
    appInstanceId: plain.appInstanceId,
    provider: plain.provider || 'gemini',
    model: plain.model || '',
    botName: plain.botName || 'Community AI',
    systemPrompt: plain.systemPrompt || '',
    temperature: plain.temperature ?? 0.7,
    maxTokens: plain.maxTokens ?? 1024,
    chatEnabled: plain.chatEnabled !== false,
    analyzePostsEnabled: plain.analyzePostsEnabled !== false,
    analyzeChatEnabled: plain.analyzeChatEnabled !== false,
    autoReplyInChat: Boolean(plain.autoReplyInChat),
    linkedChatInstanceId: plain.linkedChatInstanceId || '',
    replyOnlyWhenMentioned: plain.replyOnlyWhenMentioned !== false,
    contextPostLimit: plain.contextPostLimit ?? 25,
    contextChatLimit: plain.contextChatLimit ?? 40,
    responseLanguage: plain.responseLanguage || 'auto',
    onboardingEnabled: Boolean(plain.onboardingEnabled),
    onboardingWelcomePrompt: plain.onboardingWelcomePrompt || '',
    onboardingRulesText: plain.onboardingRulesText || '',
    onboardingSteps: Array.isArray(plain.onboardingSteps)
      ? plain.onboardingSteps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || '',
        }))
      : [],
    onboardingPostToChat: plain.onboardingPostToChat !== false,
    hasApiKey: masked.hasApiKey,
    apiKeyLast4: masked.apiKeyLast4,
    updatedAt: plain.updatedAt,
  };
  if (includeSecrets) out.apiKey = key;
  return out;
}

module.exports = {
  maskApiKey,
  generateCommunityAiText,
  buildSystemPrompt,
  serializeConfig,
  normalizeOnboardingSteps,
};
