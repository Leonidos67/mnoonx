import { communityPath } from '../constants/communityRoutes';
import { profilePath } from '../constants/paths';

export type QrScanHit = {
  path: string;
  title: string;
  subtitle: string;
  kind: 'profile' | 'community' | 'post' | 'page';
};

/** Resolve a scanned QR payload into an in-app navigation target. */
export function parseQrScanPayload(raw: string): QrScanHit | null {
  const text = String(raw || '').trim();
  if (!text) return null;

  const atOnly = text.match(/^@([a-zA-Z0-9._-]{1,64})$/);
  if (atOnly) {
    const username = atOnly[1];
    return {
      path: profilePath(username),
      title: `@${username}`,
      subtitle: 'profile',
      kind: 'profile',
    };
  }

  let url: URL;
  try {
    url = new URL(text, typeof window !== 'undefined' ? window.location.origin : 'https://mnoonx.local');
  } catch {
    return null;
  }

  const pathname = decodeURIComponent(url.pathname || '/').replace(/\/+$/, '') || '/';

  const profileMatch = pathname.match(/^\/@([^/]+)$/);
  if (profileMatch) {
    const username = profileMatch[1];
    return {
      path: profilePath(username),
      title: `@${username}`,
      subtitle: 'profile',
      kind: 'profile',
    };
  }

  const communityMatch = pathname.match(/^\/community\/([^/]+)/);
  if (communityMatch) {
    const handle = communityMatch[1];
    return {
      path: communityPath(handle),
      title: handle,
      subtitle: 'community',
      kind: 'community',
    };
  }

  const postMatch = pathname.match(/^\/post\/([^/]+)$/);
  if (postMatch) {
    const id = postMatch[1];
    return {
      path: `/post/${id}`,
      title: `Post`,
      subtitle: id,
      kind: 'post',
    };
  }

  if (pathname !== '/' && !pathname.includes('://')) {
    return {
      path: pathname + (url.search || ''),
      title: pathname,
      subtitle: 'page',
      kind: 'page',
    };
  }

  return null;
}
