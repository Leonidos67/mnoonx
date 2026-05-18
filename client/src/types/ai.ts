export interface CoinMarketRow {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d?: number | null;
  high_24h?: number | null;
  low_24h?: number | null;
  score?: number | null;
}

export interface MarketStats {
  marketCap: { value: number; change24h: number; sparkline: number[] };
  cmc20: { value: number; change24h: number; sparkline: number[] };
  fearGreed: { value: number; label: string };
  altseason: { score: number; label: string };
  avgRsi: { value: number; label: string };
}

export interface MarketsOverview {
  trackedCount: number;
  totalMarketCap: number;
  totalVolume24h: number;
  avgChange24h: number;
  topGainers: CoinMarketRow[];
  topLosers?: CoinMarketRow[];
}

export interface MarketsResponse {
  overview: MarketsOverview;
  markets: CoinMarketRow[];
  highTrust: CoinMarketRow[];
  trending: CoinMarketRow[];
  marketStats?: MarketStats;
  disclaimer: string;
}

export interface SearchCoinResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  large?: string;
  market_cap_rank: number | null;
}

export interface SearchResponse {
  coins: SearchCoinResult[];
  disclaimer: string;
}

export type PulseSentiment = 'bullish' | 'neutral' | 'bearish';

export interface ChatResponse {
  reply: string;
  disclaimer: string;
}

export interface PulseResponse {
  text: string;
  sentiment: PulseSentiment;
  disclaimer: string;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: string | null;
  description: string;
  market_cap_rank: number | null;
  current_price: number | null;
  market_cap: number | null;
  total_volume: number | null;
  high_24h: number | null;
  low_24h: number | null;
  price_change_percentage_24h: number | null;
  price_change_percentage_7d: number | null;
  price_change_percentage_30d: number | null;
  ath: number | null;
  ath_change_percentage: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  homepage: string | null;
  disclaimer: string;
}
