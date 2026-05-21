const PREFS_KEY = 'mnoonx-messenger-message-pins';

export type MessengerMessagePinsMap = Record<string, string[]>;

export function loadMessengerMessagePins(): MessengerMessagePinsMap {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as MessengerMessagePinsMap;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: MessengerMessagePinsMap = {};
    for (const [convId, ids] of Object.entries(parsed)) {
      if (Array.isArray(ids)) out[convId] = ids.filter((id) => typeof id === 'string');
    }
    return out;
  } catch {
    return {};
  }
}

export function saveMessengerMessagePins(map: MessengerMessagePinsMap): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getPinnedMessageIds(map: MessengerMessagePinsMap, conversationId: string): string[] {
  return map[conversationId] ?? [];
}
