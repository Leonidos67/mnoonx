/** Extract unique lowercase hashtags from post text */
function extractHashtags(content) {
  if (!content || typeof content !== 'string') return [];
  const matches = content.match(/#([\p{L}\p{N}_]{1,40})/gu) || [];
  const set = new Set();
  for (const m of matches) {
    const tag = m.slice(1).toLowerCase();
    if (tag) set.add(tag);
  }
  return [...set].slice(0, 20);
}

module.exports = { extractHashtags };
