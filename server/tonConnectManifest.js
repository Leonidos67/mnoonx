const path = require('path');
const {
  buildTonConnectManifest,
  manifestResponseHeaders,
  resolveSiteUrl,
} = require(path.join(__dirname, '../client/scripts/tonConnectManifestShared'));

function sendTonConnectManifest(req, res) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const origin = resolveSiteUrl({ origin: `${proto}://${host}` });

  manifestResponseHeaders(res);
  res.json(buildTonConnectManifest(origin));
}

module.exports = { sendTonConnectManifest };
