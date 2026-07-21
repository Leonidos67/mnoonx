import React, { useRef } from 'react';
import { MenuIcon, type IconHandle } from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

type AnimatedMenuIconProps = {
  size?: number;
  color?: string;
  className?: string;
};

/** Animated menu glyph — hover on parent button. */
const AnimatedMenuIcon: React.FC<AnimatedMenuIconProps> = ({
  size = 20,
  color = 'currentColor',
  className,
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);

  return (
    <span
      ref={nodeRef}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className || ''}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <MenuIcon
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

export default AnimatedMenuIcon;
