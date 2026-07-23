import React, { useRef } from 'react';
import {
  BellIcon,
  CreditCardIcon,
  GitBranchPlusIcon,
  InfoIcon,
  ShieldUserIcon,
  ShoppingBagIcon,
  UserRoundIcon,
  UserRoundPenIcon,
  UsersRoundIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import { Swords } from 'lucide-react';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

export type SettingsNavIconKind =
  | 'account'
  | 'editProfile'
  | 'invites'
  | 'connected'
  | 'security'
  | 'orders'
  | 'notifications'
  | 'payments'
  | 'resolution'
  | 'collaborations';

const ANIMATED_ICONS = {
  account: UserRoundIcon,
  editProfile: UserRoundPenIcon,
  invites: UsersRoundIcon,
  connected: GitBranchPlusIcon,
  security: ShieldUserIcon,
  orders: ShoppingBagIcon,
  notifications: BellIcon,
  payments: CreditCardIcon,
  resolution: InfoIcon,
} as const;

type AnimatedSettingsNavIconProps = {
  kind: SettingsNavIconKind;
  size?: number;
  color?: string;
  className?: string;
};

/** Animated settings sidebar icons — hover on parent button. */
export const AnimatedSettingsNavIcon: React.FC<AnimatedSettingsNavIconProps> = ({
  kind,
  size = 20,
  color = 'currentColor',
  className,
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);

  const wrapperClass = `inline-flex shrink-0 items-center justify-center overflow-hidden ${className || ''}`;
  const wrapperStyle = { width: size, height: size };

  if (kind === 'collaborations') {
    return (
      <span ref={nodeRef} className={wrapperClass} style={wrapperStyle}>
        <Swords
          size={size}
          color={color}
          strokeWidth={2}
          className="!h-full !w-full !min-h-0 !min-w-0"
          aria-hidden
        />
      </span>
    );
  }

  const Icon = ANIMATED_ICONS[kind];

  return (
    <span ref={nodeRef} className={wrapperClass} style={wrapperStyle}>
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
