import React, { useEffect, useRef } from 'react';
import {
  BoltIcon,
  CheckIcon,
  CopyIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  EyeOffIcon,
  GlobeLockIcon,
  LayoutGridIcon,
  TrashIcon,
  UserPlusIcon,
  UserRoundPenIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

export type CommunitySidebarIconKind =
  | 'ellipsisVertical'
  | 'settings'
  | 'visibility'
  | 'trash'
  | 'eyeOff'
  | 'eye'
  | 'panel'
  | 'bolt'
  | 'copy'
  | 'userPlus'
  | 'check';

type AnimatedCommunitySidebarIconProps = {
  kind: CommunitySidebarIconKind;
  size?: number;
  color?: string;
  className?: string;
  /** Play animation once when mounted / when this becomes true (e.g. success check). */
  autoPlay?: boolean;
};

/** Animated community sidebar/menu icons — hover on parent button/link/menuitem. */
export const AnimatedCommunitySidebarIcon: React.FC<AnimatedCommunitySidebarIconProps> = ({
  kind,
  size = 14,
  color = 'currentColor',
  className,
  autoPlay = false,
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);

  useEffect(() => {
    if (!autoPlay) return;
    const id = window.requestAnimationFrame(() => {
      iconRef.current?.startAnimation();
    });
    return () => window.cancelAnimationFrame(id);
  }, [autoPlay, kind]);

  const shared = {
    ref: iconRef,
    size,
    duration: 1 as const,
    color,
    isAnimated: false as const,
    className: '!h-full !w-full !min-h-0 !min-w-0',
  };

  const Icon =
    kind === 'ellipsisVertical'
      ? EllipsisVerticalIcon
      : kind === 'settings'
        ? UserRoundPenIcon
        : kind === 'visibility'
          ? GlobeLockIcon
          : kind === 'trash'
            ? TrashIcon
            : kind === 'eyeOff'
              ? EyeOffIcon
              : kind === 'eye'
                ? EyeIcon
                : kind === 'panel'
                  ? LayoutGridIcon
                  : kind === 'bolt'
                    ? BoltIcon
                    : kind === 'userPlus'
                      ? UserPlusIcon
                      : kind === 'check'
                        ? CheckIcon
                        : CopyIcon;

  return (
    <span
      ref={nodeRef}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className || ''}`}
      style={{ width: size, height: size }}
    >
      <Icon {...shared} />
    </span>
  );
};
