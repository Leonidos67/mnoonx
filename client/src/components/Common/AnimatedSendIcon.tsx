import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { SendIcon, type IconHandle } from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

export type AnimatedSendIconHandle = IconHandle;

type AnimatedSendIconProps = {
  size?: number;
  color?: string;
  className?: string;
};

/** Animated send glyph. Hover on parent button + imperative startAnimation() on submit. */
const AnimatedSendIcon = forwardRef<AnimatedSendIconHandle, AnimatedSendIconProps>(
  ({ size = 16, color = 'currentColor', className }, ref) => {
    const iconRef = useRef<IconHandle>(null);
    const nodeRef = useRef<HTMLSpanElement>(null);
    useAnimateOnParentHover(iconRef, nodeRef);

    useImperativeHandle(ref, () => ({
      startAnimation: () => iconRef.current?.startAnimation(),
      stopAnimation: () => iconRef.current?.stopAnimation(),
    }));

    return (
      <span
        ref={nodeRef}
        className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className || ''}`}
        style={{ width: size, height: size }}
      >
        <SendIcon
          ref={iconRef}
          size={size}
          duration={1}
          color={color}
          isAnimated={false}
          className="!h-full !w-full !min-h-0 !min-w-0"
        />
      </span>
    );
  }
);

AnimatedSendIcon.displayName = 'AnimatedSendIcon';

export default AnimatedSendIcon;
