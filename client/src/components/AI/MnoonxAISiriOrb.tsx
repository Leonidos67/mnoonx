import React from 'react';
import SiriOrb, { type SiriOrbProps } from './SiriOrb';

export const MNOONX_AI_ORB_COLORS = {
  bg: 'oklch(98% 0.01 264)',
  c1: 'oklch(72% 0.18 350)',
  c2: 'oklch(78% 0.14 250)',
  c3: 'oklch(76% 0.16 290)',
} as const;

interface MnoonxAISiriOrbProps {
  loading?: boolean;
  size?: string;
  className?: string;
  animationDuration?: number;
  compact?: SiriOrbProps['compact'];
}

/** Same Siri orb as on the /ai chat empty state */
const MnoonxAISiriOrb: React.FC<MnoonxAISiriOrbProps> = ({
  loading = false,
  size,
  className,
  animationDuration,
  compact,
}) => (
  <SiriOrb
    size={size ?? (loading ? '136px' : '152px')}
    animationDuration={animationDuration ?? (loading ? 10 : 22)}
    colors={MNOONX_AI_ORB_COLORS}
    className={className}
    compact={compact}
  />
);

export default MnoonxAISiriOrb;
