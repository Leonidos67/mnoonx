function buildDailyBuckets(days) {
  const buckets = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    d.setUTCDate(d.getUTCDate() - i);
    buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  return buckets;
}

function incrementBucket(buckets, isoDate) {
  if (!isoDate) return;
  const key = new Date(isoDate).toISOString().slice(0, 10);
  const row = buckets.find((b) => b.date === key);
  if (row) row.count += 1;
}

function toCumulative(buckets, baseline = 0) {
  let cumulative = baseline;
  return buckets.map((row) => {
    cumulative += row.count;
    return { date: row.date, count: row.count, total: cumulative };
  });
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countryFromLocation(location) {
  const loc = String(location || '').trim();
  if (!loc) return '';
  const part = loc.split(',')[0]?.trim();
  return part || loc;
}

function userStatusLabel(user) {
  if (user.isOnline) return 'Онлайн';
  const seen = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
  if (seen && Date.now() - seen < 7 * 24 * 60 * 60 * 1000) return 'Активен';
  return 'Неактивен';
}

module.exports = {
  buildDailyBuckets,
  incrementBucket,
  toCumulative,
  escapeRegex,
  countryFromLocation,
  userStatusLabel,
};
