const PREFS_KEY = 'mnoonx-messenger-prefs';

export interface MessengerChatPrefs {
  pinnedIds: string[];
  hiddenIds: string[];
  markedNewIds: string[];
}

const EMPTY: MessengerChatPrefs = { pinnedIds: [], hiddenIds: [], markedNewIds: [] };

export function loadMessengerChatPrefs(): MessengerChatPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<MessengerChatPrefs>;
    return {
      pinnedIds: Array.isArray(parsed.pinnedIds) ? parsed.pinnedIds : [],
      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
      markedNewIds: Array.isArray(parsed.markedNewIds) ? parsed.markedNewIds : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveMessengerChatPrefs(prefs: MessengerChatPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}
