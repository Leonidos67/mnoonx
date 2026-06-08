/** Shared TON Connect manifest fields — used by build, dev proxy, and server. */

const PRODUCTION_SITE_URL = 'https://mnoonx.fun';
const APP_NAME = 'MNOONX';

function normalizeSiteUrl(url) {
  return String(url || '').replace(/\/$/, '');
}

function resolveSiteUrl(options = {}) {
  const { origin, forStaticBuild = false } = options;

  if (process.env.REACT_APP_SITE_URL) {
    return normalizeSiteUrl(process.env.REACT_APP_SITE_URL);
  }

  if (process.env.VERCEL_URL) {
    return normalizeSiteUrl(`https://${process.env.VERCEL_URL}`);
  }

  if (origin) {
    return normalizeSiteUrl(origin);
  }

  if (forStaticBuild || process.env.NODE_ENV === 'production') {
    return PRODUCTION_SITE_URL;
  }

  return PRODUCTION_SITE_URL;
}

function buildTonConnectManifest(siteUrl) {
  const url = normalizeSiteUrl(siteUrl);
  return {
    url,
    name: APP_NAME,
    iconUrl: `${url}/tonconnect-icon-180.png`,
  };
}

function manifestResponseHeaders(res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=300');
}

module.exports = {
  APP_NAME,
  PRODUCTION_SITE_URL,
  buildTonConnectManifest,
  manifestResponseHeaders,
  normalizeSiteUrl,
  resolveSiteUrl,
};
