import React, { useRef } from 'react';
import {
  CompassIcon,
  HouseIcon,
  UserRoundIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

type NavKind = 'home' | 'discover' | 'profile';

const ICONS = {
  home: HouseIcon,
  discover: CompassIcon,
  profile: UserRoundIcon,
} as const;

type AnimatedNavIconProps = {
  kind: NavKind;
  size?: number;
  color?: string;
  className?: string;
};

/** Square animated nav glyph. Animation starts on hover of the parent link/button. */
export const AnimatedNavIcon: React.FC<AnimatedNavIconProps> = ({
  kind,
  size = 20,
  color = 'currentColor',
  className,
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);
  const Icon = ICONS[kind];

  return (
    <span
      ref={nodeRef}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className || ''}`}
      style={{ width: size, height: size }}
    >
      <Icon
        ref={iconRef}
        size={size}
        duration={1}
        color={color}
        isAnimated={false}
        className="!h-full !w-full !min-h-0 !min-w-0"
      />
    </span>
  );
};
