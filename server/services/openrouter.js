const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function normalizeApiKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let key = raw.trim().replace(/^['"]|['"]$/g, '');
  if (key && !key.startsWith('sk-') && key.startsWith('or-v1-')) {
    key = `sk-${key}`;
  }
  return key;
}

function getApiKey() {
  const key = normalizeApiKey(
    process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || ''
  );
  if (!key) {
    const err = new Error('OpenRouter API key is not configured in server/.env');
    err.status = 503;
    throw err;
  }
  return key;
}

function getModel() {
  return (process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001').trim();
}

function getPulseModel() {
  return (process.env.OPENROUTER_PULSE_MODEL || process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001').trim();
}

/**
 * @param {{ messages: Array<{ role: string, content: string }>, maxTokens?: number, temperature?: number, model?: string }} opts
 */
async function chatCompletion({ messages, maxTokens = 1200, temperature = 0.65, model }) {
  const apiKey = getApiKey();

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'http://localhost:3000',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'MNOONX',
    },
    body: JSON.stringify({
      model: model || getModel(),
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `OpenRouter request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status === 401 ? 503 : res.status >= 500 ? 502 : res.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== 'string') {
    const err = new Error('Empty response from AI provider');
    err.status = 502;
    throw err;
  }

  return content.trim();
}

module.exports = {
  chatCompletion,
  getModel,
  getPulseModel,
};
