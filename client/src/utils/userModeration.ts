import { MESSAGES_API, REPORTS_API, USERS_API } from '../config/api';

export async function hideConversation(token: string, conversationId: string): Promise<boolean> {
  try {
    const res = await fetch(`${MESSAGES_API}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function blockUser(token: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(`${USERS_API}/${encodeURIComponent(username)}/block`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function unblockUser(token: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(`${USERS_API}/${encodeURIComponent(username)}/unblock`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function reportUser(token: string, targetUserId: string, details?: string): Promise<boolean> {
  try {
    const res = await fetch(REPORTS_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        targetType: 'user',
        targetId: targetUserId,
        reason: 'other',
        details: details?.trim() || '',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
