import React from 'react';
import { Link } from 'react-router-dom';
import TradingViewChart from '../AI/TradingViewChart';
import { marketCoinPath } from '../../constants/marketRoutes';
import type { PostCoinAttachment } from '../../types/postCoin';

interface PostCoinAttachmentDisplayProps {
  coin: PostCoinAttachment;
  className?: string;
}

const PostCoinAttachmentDisplay: React.FC<PostCoinAttachmentDisplayProps> = ({
  coin,
  className = '',
}) => {
  const name = coin.name?.trim();
  const symbol = coin.symbol?.trim();
  const coinId = coin.coinId?.trim();
  if (!name || !symbol || !coinId) return null;

  const label = `${name} (${symbol.toUpperCase()})`;

  return (
    <div className={`mt-3 min-w-0 max-w-full ${className}`}>
      <Link
        to={marketCoinPath(coinId)}
        className="text-sm font-semibold text-[#315efb] underline decoration-[#315efb]/40 underline-offset-2 hover:text-[#2447c9]"
      >
        {label}
      </Link>
      <div className="mt-2 h-[min(320px,50vw)] min-h-[220px] w-full max-w-full overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <TradingViewChart symbol={symbol} fillParent className="h-full w-full" />
      </div>
    </div>
  );
};

export default PostCoinAttachmentDisplay;
