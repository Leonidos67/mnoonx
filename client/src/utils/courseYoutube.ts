/** Returns YouTube embed URL or null */
export function parseYoutubeEmbedUrl(url: string): string | null {
  const u = url.trim();
  if (!u) return null;
  if (/^[\w-]{11}$/.test(u)) return `https://www.youtube.com/embed/${u}`;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        const id = parsed.pathname.split('/')[2];
        if (id) return `https://www.youtube.com/embed/${id}`;
      }
      const v = parsed.searchParams.get('v');
      if (v && /^[\w-]{11}$/.test(v)) return `https://www.youtube.com/embed/${v}`;
      const shorts = parsed.pathname.match(/^\/shorts\/([\w-]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeThumbnailUrl(url: string): string | null {
  const embed = parseYoutubeEmbedUrl(url);
  if (!embed) return null;
  const id = embed.split('/embed/')[1]?.split('?')[0];
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
