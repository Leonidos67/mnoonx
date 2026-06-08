const fs = require('fs');
const path = require('path');
const { buildTonConnectManifest, resolveSiteUrl } = require('./tonConnectManifestShared');

require('./generateTonConnectIcon');

const isDevOnly = !process.env.REACT_APP_SITE_URL && !process.env.VERCEL_URL && process.env.NODE_ENV !== 'production';

if (isDevOnly) {
  console.log('[tonconnect] skip static manifest (dev uses setupProxy with live origin)');
  process.exit(0);
}

const siteUrl = resolveSiteUrl({ forStaticBuild: true });
const manifest = buildTonConnectManifest(siteUrl);
const outPath = path.join(__dirname, '../public/tonconnect-manifest.json');

fs.writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`[tonconnect] manifest url: ${siteUrl}`);
