import { getExternalHostname } from './externalLinks';

const STORAGE_KEY = 'mnoonx-browse-recent';
const MAX_ITEMS = 40;

export type BrowseRecentItem = {
  url: string;
  host: string;
  visitedAt: number;
};

function readRaw(): BrowseRecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BrowseRecentItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.url === 'string' && item.url);
  } catch {
    return [];
  }
}

function writeRaw(items: BrowseRecentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* ignore quota */
  }
}

export function getBrowseRecent(): BrowseRecentItem[] {
  return readRaw().sort((a, b) => b.visitedAt - a.visitedAt);
}

export function rememberBrowseVisit(url: string): BrowseRecentItem[] {
  const normalized = String(url || '').trim();
  if (!normalized) return getBrowseRecent();
  const host = getExternalHostname(normalized);
  const next: BrowseRecentItem = {
    url: normalized,
    host,
    visitedAt: Date.now(),
  };
  const byUrl = readRaw().filter((item) => item.url !== normalized);
  const merged = [next, ...byUrl].slice(0, MAX_ITEMS);
  writeRaw(merged);
  return getBrowseRecent();
}

export function clearBrowseRecent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function removeBrowseRecent(url: string): BrowseRecentItem[] {
  writeRaw(readRaw().filter((item) => item.url !== url));
  return getBrowseRecent();
}
