import React from 'react';
import { Link } from 'react-router-dom';

interface MnoonxLogoProps {
  className?: string;
  /** `sm` — header; `md` — sidebar */
  size?: 'sm' | 'md';
}

const sizeClasses = {
  sm: { mn: 'text-lg', oo: 'text-xl', nx: 'text-lg' },
  md: { mn: 'text-2xl', oo: 'text-3xl', nx: 'text-2xl' },
} as const;

const MnoonxLogo: React.FC<MnoonxLogoProps> = ({ className = '', size = 'md' }) => {
  const s = sizeClasses[size];
  return (
    <Link
      to="/"
      className={`flex shrink-0 items-center gap-0 font-bold text-gray-900 transition-transform active:scale-[0.99] ${className}`}
      aria-label="MNOONX home"
    >
      <span className={`pixelify-logo truncate ${s.mn}`}>MN</span>
      <span className={`pixelify-logo truncate ${s.oo}`}>OO</span>
      <span className={`pixelify-logo truncate ${s.nx}`}>NX</span>
    </Link>
  );
};

export default MnoonxLogo;
