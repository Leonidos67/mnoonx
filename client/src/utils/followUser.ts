import { USERS_API } from '../config/api';

/** Follow a user by username. Treats "Already following" as success. */
export async function followUserByUsername(
  username: string,
  token: string
): Promise<{ ok: boolean; alreadyFollowing?: boolean; error?: string }> {
  const clean = String(username || '').replace(/^@/, '').trim();
  if (!clean) return { ok: false, error: 'Missing username' };

  try {
    const res = await fetch(`${USERS_API}/${encodeURIComponent(clean)}/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    if (res.ok) return { ok: true };
    if (typeof data.message === 'string' && data.message.includes('Already following')) {
      return { ok: true, alreadyFollowing: true };
    }
    return { ok: false, error: data.message || 'Failed' };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}
