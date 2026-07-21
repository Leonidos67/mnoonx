declare module '@animateicons/react/lucide' {
  import type { ForwardRefExoticComponent, HTMLAttributes, RefAttributes } from 'react';

  export type IconHandle = {
    startAnimation: () => void;
    stopAnimation: () => void;
  };

  export type IconProps = Omit<
    HTMLAttributes<HTMLDivElement>,
    | 'color'
    | 'onDrag'
    | 'onDragStart'
    | 'onDragEnd'
    | 'onAnimationStart'
    | 'onAnimationEnd'
    | 'onAnimationIteration'
  > & {
    size?: number;
    duration?: number;
    isAnimated?: boolean;
    color?: string;
  };

  export type IconComponent = ForwardRefExoticComponent<IconProps & RefAttributes<IconHandle>>;

  export const ChevronLeftIcon: IconComponent;
  export const ChevronRightIcon: IconComponent;
  export const ChevronUpIcon: IconComponent;
  export const ChevronDownIcon: IconComponent;
  export const EllipsisIcon: IconComponent;
  export const LinkIcon: IconComponent;
  export const UserPenIcon: IconComponent;
  export const TrashIcon: IconComponent;
  export const MessageCircleIcon: IconComponent;
  export const BellIcon: IconComponent;
  export const HeartIcon: IconComponent;
  export const GitCompareArrowsIcon: IconComponent;
  export const SendIcon: IconComponent;
  export const HouseIcon: IconComponent;
  export const CompassIcon: IconComponent;
  export const UserRoundIcon: IconComponent;
  export const PlusIcon: IconComponent;
  export const CirclePlusIcon: IconComponent;
  export const ReplyIcon: IconComponent;
  export const SearchIcon: IconComponent;
  export const EllipsisVerticalIcon: IconComponent;
  export const UserRoundPenIcon: IconComponent;
  export const GlobeLockIcon: IconComponent;
  export const EyeOffIcon: IconComponent;
  export const EyeIcon: IconComponent;
  export const LayoutGridIcon: IconComponent;
  export const BoltIcon: IconComponent;
  export const CopyIcon: IconComponent;
  export const UserPlusIcon: IconComponent;
  export const CheckIcon: IconComponent;
  export const UsersRoundIcon: IconComponent;
  export const GitBranchPlusIcon: IconComponent;
  export const ShieldUserIcon: IconComponent;
  export const ShoppingBagIcon: IconComponent;
  export const CreditCardIcon: IconComponent;
  export const InfoIcon: IconComponent;
  export const MenuIcon: IconComponent;
}
