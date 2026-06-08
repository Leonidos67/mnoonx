const {
  buildTonConnectManifest,
  manifestResponseHeaders,
  resolveSiteUrl,
} = require('../scripts/tonConnectManifestShared');

/** Dynamic TON Connect manifest — `url` must match the browser origin in dev. */
module.exports = function setupProxy(app) {
  app.get('/tonconnect-manifest.json', (req, res) => {
    const host = req.get('host');
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const origin = resolveSiteUrl({ origin: `${proto}://${host}` });

    manifestResponseHeaders(res);
    res.json(buildTonConnectManifest(origin));
  });
};
