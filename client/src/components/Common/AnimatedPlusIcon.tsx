import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import {
  CirclePlusIcon,
  PlusIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

export type AnimatedPlusIconHandle = IconHandle;

type Props = {
  size?: number;
  color?: string;
  className?: string;
  /** CirclePlusIcon vs PlusIcon */
  variant?: 'plus' | 'circle';
};

/** Plus / CirclePlus — animation on hover of parent button/link. */
const AnimatedPlusIcon = forwardRef<AnimatedPlusIconHandle, Props>(
  ({ size = 20, color = 'currentColor', className, variant = 'plus' }, ref) => {
    const iconRef = useRef<IconHandle>(null);
    const nodeRef = useRef<HTMLSpanElement>(null);
    useAnimateOnParentHover(iconRef, nodeRef);

    useImperativeHandle(ref, () => ({
      startAnimation: () => iconRef.current?.startAnimation(),
      stopAnimation: () => iconRef.current?.stopAnimation(),
    }));

    const Icon = variant === 'circle' ? CirclePlusIcon : PlusIcon;

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
  }
);

AnimatedPlusIcon.displayName = 'AnimatedPlusIcon';

export default AnimatedPlusIcon;
