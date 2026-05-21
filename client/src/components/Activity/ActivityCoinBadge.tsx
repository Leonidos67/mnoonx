import React from 'react';
import { Star } from 'lucide-react';

interface ActivityCoinBadgeProps {
  balance: number;
  className?: string;
}

const ActivityCoinBadge: React.FC<ActivityCoinBadgeProps> = ({ balance, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold tabular-nums text-neutral-900 ${className}`}
  >
    {balance.toLocaleString()}
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-violet-500 shadow-sm">
      <Star className="h-3.5 w-3.5 fill-white text-white" aria-hidden />
    </span>
  </span>
);

export default ActivityCoinBadge;
