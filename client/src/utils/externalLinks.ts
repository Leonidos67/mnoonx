/** Normalize and classify external URLs for the in-app browser gate. */

export function normalizeExternalUrl(raw: string): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return null;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : trimmed.startsWith('//')
        ? `https:${trimmed}`
        : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

export function getExternalHostname(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

export function isSameOriginUrl(href: string): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return new URL(href).origin === window.location.origin;
  } catch {
    return false;
  }
}
