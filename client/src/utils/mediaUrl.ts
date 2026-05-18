export const API_ORIGIN = 'http://localhost:5000';

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_ORIGIN}${path}`;
}
