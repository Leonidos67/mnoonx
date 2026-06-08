import type { PostCoinAttachment } from '../types/postCoin';

const COIN_TOKEN_RE = /\[\[coin:([^\]]+)\]\]/g;

export interface CoinMessagePart {
  type: 'coin';
  coinId: string;
  name: string;
  symbol: string;
}

function parseTokenParams(inner: string): Record<string, string> {
  const params: Record<string, string> = {};
  inner.split(';').forEach((segment) => {
    const eq = segment.indexOf('=');
    if (eq <= 0) return;
    const key = segment.slice(0, eq).trim();
    const raw = segment.slice(eq + 1);
    try {
      params[key] = decodeURIComponent(raw);
    } catch {
      params[key] = raw;
    }
  });
  return params;
}

export function encodeCoinMessage(coin: PostCoinAttachment): string {
  const id = encodeURIComponent(coin.coinId);
  const name = encodeURIComponent(coin.name);
  const symbol = encodeURIComponent(coin.symbol);
  return `[[coin:id=${id};name=${name};symbol=${symbol}]]`;
}

export function parseCoinParams(inner: string): Omit<CoinMessagePart, 'type'> | null {
  const params = parseTokenParams(inner);
  if (!params.id || !params.name || !params.symbol) return null;
  return {
    coinId: params.id,
    name: params.name,
    symbol: params.symbol,
  };
}

export function parseCoinToken(text: string): CoinMessagePart | null {
  const re = new RegExp(COIN_TOKEN_RE.source);
  const match = re.exec(text.trim());
  if (!match) return null;
  const parsed = parseCoinParams(match[1]);
  if (!parsed) return null;
  return { type: 'coin', ...parsed };
}

export function isCoinOnlyMessage(text: string): boolean {
  const trimmed = text.trim();
  const re = new RegExp(`^${COIN_TOKEN_RE.source}$`);
  return re.test(trimmed);
}

export function coinPreviewLabel(coin: Pick<CoinMessagePart, 'name' | 'symbol'>): string {
  return `${coin.name} (${coin.symbol.toUpperCase()})`;
}
