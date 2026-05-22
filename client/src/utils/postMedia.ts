import { API_ORIGIN } from './mediaUrl';

export const POSTS_API_URL = `${API_ORIGIN}/api/posts`;
export const MAX_POST_MEDIA = 10;

/** Uploaded file path or external https image URL. */
export function normalizePostMediaUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/uploads/post-media/')) return trimmed;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function isValidPostMediaUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/uploads/post-media/')) return true;
  return normalizePostMediaUrl(trimmed) !== null;
}

export async function uploadPostMediaFiles(
  token: string,
  files: File[]
): Promise<string[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(`${POSTS_API_URL}/media/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to upload images');
  }
  return data.urls || [];
}
