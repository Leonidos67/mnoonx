import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderIconBadgeProps {
  to: string;
  label: string;
  count: number;
  /** Full accessible name when there are unread items (e.g. translated “Notifications, 3 unread”). */
  ariaLabelWhenUnread?: string;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const HeaderIconBadge: React.FC<HeaderIconBadgeProps> = ({
  to,
  label,
  count,
  ariaLabelWhenUnread,
  children,
  onMouseEnter,
  onMouseLeave,
}) => {
  const display = count > 99 ? '99+' : count > 0 ? String(count) : null;
  const aria =
    display && (ariaLabelWhenUnread ?? `${label}, ${count} unread`);

  return (
    <Link
      to={to}
      aria-label={aria ?? label}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-neutral-600 transition-all hover:bg-black/10 hover:text-neutral-700 active:scale-[0.95]"
    >
      {children}
      {display && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e5484d] px-1 text-[10px] font-bold leading-none text-white">
          {display}
        </span>
      )}
    </Link>
  );
};

export default HeaderIconBadge;
