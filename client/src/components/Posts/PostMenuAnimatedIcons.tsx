import React, { useRef } from 'react';
import {
  EllipsisIcon,
  LinkIcon,
  TrashIcon,
  UserPenIcon,
  UserPlusIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

type Kind = 'ellipsis' | 'link' | 'edit' | 'trash' | 'follow';

type AnimatedPostMenuIconProps = {
  kind: Kind;
  size?: number;
  color?: string;
  className?: string;
};

/** Animated post-menu icon. Animation starts on hover of the parent button/link. */
export const AnimatedPostMenuIcon: React.FC<AnimatedPostMenuIconProps> = ({
  kind,
  size = kind === 'ellipsis' ? 16 : 14,
  color = 'currentColor',
  className,
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);

  const shared = {
    ref: iconRef,
    size,
    duration: 1 as const,
    color,
    isAnimated: false as const,
    className: '!h-full !w-full !min-h-0 !min-w-0',
  };

  return (
    <span
      ref={nodeRef}
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden ${className || ''}`}
      style={{ width: size, height: size }}
    >
      {kind === 'ellipsis' ? (
        <EllipsisIcon {...shared} />
      ) : kind === 'link' ? (
        <LinkIcon {...shared} />
      ) : kind === 'edit' ? (
        <UserPenIcon {...shared} />
      ) : kind === 'follow' ? (
        <UserPlusIcon {...shared} />
      ) : (
        <TrashIcon {...shared} />
      )}
    </span>
  );
};
