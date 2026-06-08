import React from 'react';
import { Link } from 'react-router-dom';
import TradingViewChart from '../AI/TradingViewChart';
import { marketCoinPath } from '../../constants/marketRoutes';
import type { CoinMessagePart } from '../../utils/messengerCoins';

interface MessengerCoinMessageCardProps {
  coin: Pick<CoinMessagePart, 'coinId' | 'name' | 'symbol'>;
  compact?: boolean;
}

const MessengerCoinMessageCard: React.FC<MessengerCoinMessageCardProps> = ({
  coin,
  compact = false,
}) => {
  const name = coin.name?.trim();
  const symbol = coin.symbol?.trim();
  const coinId = coin.coinId?.trim();
  if (!name || !symbol || !coinId) return null;

  const label = `${name} (${symbol.toUpperCase()})`;
  const chartHeight = compact ? 'h-[min(200px,45vw)] min-h-[160px]' : 'h-[min(240px,50vw)] min-h-[200px]';

  return (
    <div className={`min-w-0 max-w-full ${compact ? 'w-[min(280px,85vw)]' : 'w-[min(300px,90vw)]'}`}>
      <Link
        to={marketCoinPath(coinId)}
        className="text-sm font-semibold text-[#315efb] underline decoration-[#315efb]/40 underline-offset-2 hover:text-[#2447c9]"
      >
        {label}
      </Link>
      <div
        className={`mt-2 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white ${chartHeight}`}
      >
        <TradingViewChart symbol={symbol} fillParent className="h-full w-full" />
      </div>
    </div>
  );
};

export default MessengerCoinMessageCard;
