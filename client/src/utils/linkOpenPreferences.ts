const STORAGE_KEY = 'mnoonx.linkOpenPreference';

export type LinkOpenPreference = 'ask' | 'here' | 'newTab';

const VALID: ReadonlySet<string> = new Set(['ask', 'here', 'newTab']);

export function getLinkOpenPreference(): LinkOpenPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && VALID.has(raw)) return raw as LinkOpenPreference;
  } catch {
    /* ignore */
  }
  return 'ask';
}

export function setLinkOpenPreference(value: LinkOpenPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export const LINK_OPEN_SETTINGS_PATH = '/settings?section=security&focus=links';
