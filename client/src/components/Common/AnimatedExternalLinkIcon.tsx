import React, { useRef } from 'react';
import { ExternalLinkIcon, type IconHandle } from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

type AnimatedExternalLinkIconProps = {
  size?: number;
  color?: string;
  className?: string;
};

/** Animated external-link glyph — hover on parent button. */
const AnimatedExternalLinkIcon: React.FC<AnimatedExternalLinkIconProps> = ({
  size = 16,
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
      <ExternalLinkIcon
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

export default AnimatedExternalLinkIcon;
