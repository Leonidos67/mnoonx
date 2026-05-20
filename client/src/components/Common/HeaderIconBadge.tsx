import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderIconBadgeProps {
  to: string;
  label: string;
  count: number;
  /** Full accessible name when there are unread items (e.g. translated “Notifications, 3 unread”). */
  ariaLabelWhenUnread?: string;
  children: React.ReactNode;
}

const HeaderIconBadge: React.FC<HeaderIconBadgeProps> = ({
  to,
  label,
  count,
  ariaLabelWhenUnread,
  children,
}) => {
  const display = count > 99 ? '99+' : count > 0 ? String(count) : null;
  const aria =
    display && (ariaLabelWhenUnread ?? `${label}, ${count} unread`);

  return (
    <Link
      to={to}
      aria-label={aria ?? label}
      className="relative p-2 text-neutral-600 border hover:text-neutral-700 hover:bg-black/10 rounded-full active:scale-[0.95] transition-all"
    >
      {children}
      {display && (
        <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e5484d] px-1 text-[10px] font-bold leading-none text-white">
          {display}
        </span>
      )}
    </Link>
  );
};

export default HeaderIconBadge;
