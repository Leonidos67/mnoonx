const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

function getApiKey(override) {
  const fromOverride = String(override || '').trim().replace(/^['"]|['"]$/g, '');
  if (fromOverride) return fromOverride;
  const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '').trim();
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not set in server/.env');
    err.status = 503;
    throw err;
  }
  return key.replace(/^['"]|['"]$/g, '');
}

function getModel() {
  return (process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite').trim();
}

function friendlyError(status, rawMessage) {
  const msg = String(rawMessage || '');
  if (status === 429 || /quota/i.test(msg)) {
    return 'Gemini quota exceeded. Enable billing or wait, then retry. https://ai.google.dev/gemini-api/docs/rate-limits';
  }
  if (/location is not supported/i.test(msg)) {
    return 'Gemini API is not available in your region. Use a supported region or VPN, or another provider.';
  }
  if (status === 403 || /API key not valid/i.test(msg)) {
    return 'Invalid Gemini API key. Check GEMINI_API_KEY in server/.env';
  }
  return msg || 'Gemini request failed';
}

/**
 * @param {{ system?: string, user: string, maxTokens?: number, temperature?: number, model?: string, apiKey?: string }} opts
 */
async function generateText({
  system,
  user,
  maxTokens = 1200,
  temperature = 0.7,
  model,
  useGoogleSearch = false,
  apiKey,
}) {
  const modelId = model || getModel();
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(modelId)}:generateContent`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  if (useGoogleSearch) {
    body.tools = [{ google_search: {} }];
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': getApiKey(apiKey),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw =
      data?.error?.message ||
      data?.message ||
      `Gemini request failed (${res.status})`;
    const err = new Error(friendlyError(res.status, raw));
    err.status = res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status;
    throw err;
  }

  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p) => p?.text || '').join('').trim()
    : '';

  if (!text) {
    const blockReason = data?.candidates?.[0]?.finishReason;
    const err = new Error(
      blockReason ? `Gemini blocked response: ${blockReason}` : 'Empty response from Gemini'
    );
    err.status = 502;
    throw err;
  }

  return text;
}

/**
 * OpenAI-style messages → Gemini generateText
 */
async function chatCompletion({
  messages,
  maxTokens = 1200,
  temperature = 0.65,
  model,
  useGoogleSearch = false,
}) {
  const list = Array.isArray(messages) ? messages : [];
  const system = list
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const user = list
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n\n');

  return generateText({
    system: system || undefined,
    user,
    maxTokens,
    temperature,
    model,
    useGoogleSearch,
  });
}

module.exports = {
  generateText,
  chatCompletion,
  getModel,
};
