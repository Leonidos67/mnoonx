import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import type { IconHandle } from '@animateicons/react/lucide';

type AnimateIconProps = {
  size?: number;
  duration?: number;
  color?: string;
  isAnimated?: boolean;
  className?: string;
};

type AnimateIcon = ForwardRefExoticComponent<AnimateIconProps & RefAttributes<IconHandle>>;

export const DownloadIcon: AnimateIcon;
export const ScanIcon: AnimateIcon;
export const ShareIcon: AnimateIcon;
