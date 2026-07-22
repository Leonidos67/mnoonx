const express = require('express');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const net = require('net');
const dns = require('dns').promises;
const auth = require('../middleware/auth');

const router = express.Router();
const MAX_BODY = 2 * 1024 * 1024;
const TIMEOUT_MS = 12000;

function isPrivateIp(ip) {
  if (!ip) return true;
  const v = String(ip).toLowerCase().replace(/^::ffff:/, '');
  if (v === '127.0.0.1' || v === '::1' || v === '0.0.0.0') return true;
  if (v.startsWith('10.')) return true;
  if (v.startsWith('192.168.')) return true;
  if (v.startsWith('169.254.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(v)) return true;
  if (v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')) return true;
  return false;
}

async function assertSafeUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Unsupported protocol');
  }
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new Error('Blocked host');
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    throw new Error('Blocked host');
  }
  try {
    const looked = await dns.lookup(host, { all: true });
    for (const entry of looked) {
      if (isPrivateIp(entry.address)) throw new Error('Blocked host');
    }
  } catch (err) {
    if (err.message === 'Blocked host') throw err;
  }
  return parsed;
}

function fetchResource(targetUrl, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) {
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
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.get(
      parsed,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 MNOONXBrowser/1.0',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode || 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          const next = new URL(res.headers.location, parsed).toString();
          res.resume();
          fetchResource(next, redirects + 1).then(resolve).catch(reject);
          return;
        }
        const chunks = [];
        let size = 0;
        res.on('data', (chunk) => {
          size += chunk.length;
          if (size > MAX_BODY) {
            res.destroy();
            reject(new Error('Response too large'));
            return;
          }
          chunks.push(chunk);
        });
        res.on('end', () => {
          resolve({
            status,
            headers: res.headers || {},
            body: Buffer.concat(chunks),
            finalUrl: parsed.toString(),
          });
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

function directoryBase(finalUrl) {
  try {
    const u = new URL(finalUrl);
    const path = u.pathname.endsWith('/')
      ? u.pathname
      : u.pathname.replace(/[^/]*$/, '');
    return `${u.origin}${path || '/'}`;
  } catch {
    return finalUrl;
  }
}

function rewriteHtmlForProxy(html, finalUrl) {
  const baseHref = directoryBase(finalUrl);
  let out = String(html);

  // Drop framing / CSP meta that would break nested navigation UX
  out = out.replace(/<meta[^>]+http-equiv=["']?content-security-policy["']?[^>]*>/gi, '');
  out = out.replace(/<meta[^>]+http-equiv=["']?x-frame-options["']?[^>]*>/gi, '');

  if (!/<base\s/i.test(out)) {
    if (/<head[^>]*>/i.test(out)) {
      out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${baseHref}">`);
    } else {
      out = `<head><base href="${baseHref}"></head>${out}`;
    }
  } else {
    out = out.replace(/<base[^>]*>/i, `<base href="${baseHref}">`);
  }

  const bridge = `
<script data-mnoonx-bridge>
(function () {
  function notify(url) {
    try {
      window.parent.postMessage({ source: 'mnoonx-browse', type: 'navigate', url: url }, '*');
    } catch (e) {}
  }
  function absoluteUrl(href) {
    try {
      var u = new URL(href, document.baseURI || location.href);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      return u.href;
    } catch (e) { return null; }
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#' || raw.indexOf('javascript:') === 0 || raw.indexOf('mailto:') === 0 || raw.indexOf('tel:') === 0) return;
    var abs = absoluteUrl(a.href);
    if (!abs) return;
    e.preventDefault();
    e.stopPropagation();
    notify(abs);
  }, true);
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.action) return;
    var method = (form.method || 'get').toLowerCase();
    if (method !== 'get') return;
    var abs = absoluteUrl(form.action);
    if (!abs) return;
    e.preventDefault();
    var data = new FormData(form);
    var qs = new URLSearchParams(data).toString();
    var next = abs;
    if (qs) next += (abs.indexOf('?') >= 0 ? '&' : '?') + qs;
    notify(next);
  }, true);
  try {
    // intentional no-op on load — parent already knows the URL
  } catch (e) {}
})();
</script>`;

  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${bridge}</body>`);
  } else {
    out = `${out}${bridge}`;
  }

  return out;
}

// GET /api/browse?url=
router.get('/', auth, async (req, res) => {
  try {
    const raw = String(req.query.url || '').trim();
    if (!raw) return res.status(400).send('url required');

    let normalized = raw;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    await assertSafeUrl(normalized);
    const fetched = await fetchResource(normalized);
    const contentType = String(fetched.headers['content-type'] || 'application/octet-stream');
    const isHtml =
      contentType.includes('text/html') ||
      contentType.includes('application/xhtml') ||
      /\.html?(?:\?|$)/i.test(fetched.finalUrl);

    // Allow our client to embed this response
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' http://localhost:3000 http://127.0.0.1:3000 https://mnoonx.fun https://www.mnoonx.fun",
    );
    res.setHeader('Cache-Control', 'private, max-age=60');

    if (isHtml) {
      const html = rewriteHtmlForProxy(fetched.body.toString('utf8'), fetched.finalUrl);
      res.status(fetched.status >= 400 ? fetched.status : 200);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }

    res.status(fetched.status >= 400 ? fetched.status : 200);
    res.setHeader('Content-Type', contentType);
    return res.send(fetched.body);
  } catch (error) {
    console.error('[browse]', error.message || error);
    res.status(502);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.removeHeader('X-Frame-Options');
    return res.send(`<!doctype html><html><head><meta charset="utf-8"><title>Unavailable</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#fafafa;color:#171717}
.card{max-width:360px;padding:24px;text-align:center}h1{font-size:18px;margin:0 0 8px}p{font-size:14px;color:#737373;line-height:1.5}</style>
</head><body><div class="card"><h1>Couldn’t load this page</h1><p>The site didn’t respond or blocked the request. Use “Open in new tab”.</p></div></body></html>`);
  }
});

module.exports = router;
