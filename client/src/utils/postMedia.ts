import { API_ORIGIN } from './mediaUrl';

export const POSTS_API_URL = `${API_ORIGIN}/api/posts`;
export const MAX_POST_MEDIA = 10;

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
