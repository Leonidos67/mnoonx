export const NETWORK_UNREACHABLE_EVENT = 'mnoonx:network-unreachable';
export const NETWORK_RESTORED_EVENT = 'mnoonx:network-restored';

export function reportNetworkUnreachable(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NETWORK_UNREACHABLE_EVENT));
}

export function reportNetworkRestored(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(NETWORK_RESTORED_EVENT));
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}
