/**
 * Downloads MAX picker Lottie JSON into client/public/lottie/ for same-origin playback.
 * Run: node server/scripts/downloadAnimojiLottie.js
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://st.max.ru/lottie_old';
const OUT_DIR = path.join(__dirname, '../../client/public/lottie');

const SLUGS = [
  'kiss', 'heart', 'fire', 'cry', 'clap', 'star', 'rocket', 'gift', 'heart_eyes', 'tada',
  'sparkles', 'broken_heart', 'two_hearts', 'devil', 'unicorn', 'crown', 'balloon', 'bomb',
  'eyes', 'ok', 'rage', 'fear', 'sick', 'wine', 'cake', 'cat', 'dog', '100', 'bell', 'ball',
  'zzz', 'thumbs_down', 'skull', 'question', 'exclamation', 'medal', 'stop',
];

async function download(slug) {
  const url = `${BASE}/picker_${slug}.json`;
  const dest = path.join(OUT_DIR, `picker_${slug}.json`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
  const text = await res.text();
  JSON.parse(text);
  fs.writeFileSync(dest, text, 'utf8');
  console.log(`OK ${slug}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let failed = 0;
  for (const slug of SLUGS) {
    try {
      await download(slug);
    } catch (err) {
      console.error(`FAIL ${slug}:`, err.message);
      failed += 1;
    }
  }
  if (failed > 0) process.exit(1);
  console.log(`Done: ${SLUGS.length - failed}/${SLUGS.length} files in ${OUT_DIR}`);
}

main();
