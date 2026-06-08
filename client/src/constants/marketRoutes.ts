export function marketCoinPath(coinId: string): string {
  return `/discover/coin/${encodeURIComponent(coinId)}`;
}

export const MARKET_TAB_PATH = '/discover?tab=market';
