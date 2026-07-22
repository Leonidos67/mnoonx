const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const auth = require('../middleware/auth');

const router = express.Router();
const cache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_BODY = 512 * 1024;

function fetchText(targetUrl, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) {
      reject(new Error('Too many redirects'));
      return;
    }
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      reject(new Error('Invalid URL'));
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      reject(new Error('Unsupported protocol'));
      return;
    }
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(
      parsed,
      {
        headers: {
          'User-Agent': 'MNOONXLinkPreview/1.0',
          Accept: 'text/html,application/xhtml+xml',
        },
        timeout: 8000,
      },
      (res) => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          const next = new URL(res.headers.location, parsed).toString();
          res.resume();
          fetchText(next, redirects + 1).then(resolve).catch(reject);
          return;
        }
        const ctype = String(res.headers['content-type'] || '');
        if (!ctype.includes('text/html') && !ctype.includes('application/xhtml')) {
          res.resume();
          resolve({ html: '', finalUrl: parsed.toString() });
          return;
        }
        const chunks = [];
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
          if (size > MAX_BODY) {
            res.destroy();
            resolve({ html: Buffer.concat(chunks).toString('utf8'), finalUrl: parsed.toString() });
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({ html: Buffer.concat(chunks).toString('utf8'), finalUrl: parsed.toString() });
        });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function fetchHeaders(targetUrl, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 4) {
      reject(new Error('Too many redirects'));
      return;
    }
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      reject(new Error('Invalid URL'));
      return;
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      reject(new Error('Unsupported protocol'));
      return;
    }
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      parsed,
      {
        method: 'HEAD',
        headers: {
          'User-Agent': 'MNOONXLinkPreview/1.0',
          Accept: '*/*',
        },
        timeout: 6000,
      },
      (res) => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          const next = new URL(res.headers.location, parsed).toString();
          res.resume();
          fetchHeaders(next, redirects + 1).then(resolve).catch(reject);
          return;
        }
        res.resume();
        resolve({ headers: res.headers || {}, finalUrl: parsed.toString(), status });
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

function canEmbedFromHeaders(headers) {
  const xfo = String(headers['x-frame-options'] || '').trim().toLowerCase();
  if (xfo === 'deny' || xfo === 'sameorigin') return false;

  const csp = String(headers['content-security-policy'] || '');
  const frameAncestors = csp.match(/frame-ancestors\s+([^;]+)/i);
  if (frameAncestors) {
    const value = frameAncestors[1].trim().toLowerCase();
    if (value === "'none'" || value === 'none') return false;
    if (value === "'self'" || value === 'self') return false;
    // Explicit allow-list that does not include our origin / *
    if (!value.includes('*') && !value.includes('http')) return false;
  }
  return true;
}

const embedCache = new Map();
const EMBED_CACHE_TTL_MS = 30 * 60 * 1000;

function metaContent(html, property) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      'i',
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return '';
}

function extractTitle(html) {
  const og = metaContent(html, 'og:title') || metaContent(html, 'twitter:title');
  if (og) return og;
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m?.[1]?.trim() || '';
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// GET /api/link-preview/embed-check?url=
router.get('/embed-check', auth, async (req, res) => {
  try {
    const raw = String(req.query.url || '').trim();
    if (!raw) return res.status(400).json({ message: 'url required' });
    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    const cached = embedCache.get(normalized);
    if (cached && Date.now() - cached.at < EMBED_CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    let canEmbed = true;
    let finalUrl = normalized;
    try {
      const result = await fetchHeaders(normalized);
      finalUrl = result.finalUrl || normalized;
      canEmbed = canEmbedFromHeaders(result.headers);
    } catch {
      // If HEAD fails, assume not embeddable to avoid showing a broken browser error page.
      canEmbed = false;
    }

    const data = { url: finalUrl, canEmbed };
    embedCache.set(normalized, { at: Date.now(), data });
    res.json(data);
  } catch (error) {
    console.error('Embed check error:', error.message);
    res.json({ url: String(req.query.url || ''), canEmbed: false });
  }
});

// GET /api/link-preview?url=
router.get('/', auth, async (req, res) => {
  try {
    const raw = String(req.query.url || '').trim();
    if (!raw) return res.status(400).json({ message: 'url required' });
    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    const cached = cache.get(normalized);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return res.json(cached.data);
    }

    const { html, finalUrl } = await fetchText(normalized);
    const title = decodeEntities(extractTitle(html)).slice(0, 160);
    const description = decodeEntities(
      metaContent(html, 'og:description') || metaContent(html, 'description') || '',
    ).slice(0, 280);
    let image = metaContent(html, 'og:image') || metaContent(html, 'twitter:image') || '';
    if (image && !/^https?:\/\//i.test(image)) {
      try {
        image = new URL(image, finalUrl).toString();
      } catch {
        image = '';
      }
    }
    let siteName = '';
    try {
      siteName = new URL(finalUrl).hostname.replace(/^www\./, '');
    } catch {
      siteName = '';
    }

    const data = {
      url: finalUrl || normalized,
      title: title || siteName || normalized,
      description,
      image,
      siteName,
    };
    cache.set(normalized, { at: Date.now(), data });
    res.json(data);
  } catch (error) {
    console.error('Link preview error:', error.message);
    res.status(502).json({ message: 'Failed to fetch preview' });
  }
});

module.exports = router;
