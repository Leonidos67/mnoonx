/** TON Connect helpers — see https://docs.ton.org/applications/ton-connect/get-started */

export const TON_CONNECT_SITE_URL = 'https://mnoonx.fun';

/** Manifest is always served from the current origin (required by wallets). */
export function tonConnectManifestUrl(): string {
  if (typeof window === 'undefined') return '/tonconnect-manifest.json';
  return `${window.location.origin}/tonconnect-manifest.json`;
}

export function isTonFriendlyAddress(address: string): boolean {
  const a = address.trim();
  return /^(UQ|EQ|kQ)[A-Za-z0-9_-]{46}$/.test(a) || /^-?\d+:[a-fA-F0-9]{64}$/i.test(a);
}

export function shortTonAddress(address: string, head = 6, tail = 4): string {
  const a = address.trim();
  if (a.length <= head + tail + 3) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}
