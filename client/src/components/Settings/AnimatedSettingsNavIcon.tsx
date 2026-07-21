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
  | 'resolution';

const ICONS = {
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
