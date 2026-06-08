export interface PortfolioNetwork {
  id: string;
  label: string;
  nativeSymbol: string;
}

export interface PortfolioWallet {
  _id: string;
  address: string;
  chain: string;
  label: string;
  lastSyncedAt: string | null;
}

export interface PortfolioHolding {
  _id: string;
  coinId: string;
  symbol: string;
  name: string;
  amount: number;
  avgBuyPriceUsd: number | null;
  source: 'manual' | 'wallet';
  txType: string;
  txDate: string;
  notes: string;
  contractAddress?: string;
  chain?: string;
  imageUrl?: string;
  priceUsd?: number | null;
  change24h?: number | null;
  valueUsd?: number | null;
  costBasisUsd?: number | null;
  profitUsd?: number | null;
  profitPct?: number | null;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalCostUsd: number | null;
  totalProfitUsd: number | null;
  change24h: number | null;
  holdingsCount: number;
  walletsCount: number;
}

export interface PortfolioOverview {
  summary: PortfolioSummary;
  holdings: PortfolioHolding[];
  wallets: PortfolioWallet[];
}
