import React, { useRef } from 'react';
import { ReplyIcon, type IconHandle } from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

type AnimatedReplyIconProps = {
  size?: number;
  color?: string;
  className?: string;
};

/** Animated reply glyph — hover on parent button. */
const AnimatedReplyIcon: React.FC<AnimatedReplyIconProps> = ({
  size = 14,
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
    >
      <ReplyIcon
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

export default AnimatedReplyIcon;
