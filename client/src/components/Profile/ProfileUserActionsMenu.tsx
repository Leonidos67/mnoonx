import React, { useRef } from 'react';
import {
  CopyIcon,
  HeadsetIcon,
  LockIcon,
  type IconHandle,
} from '@animateicons/react/lucide';
import FloatingMenu, { type FloatingMenuAnchor } from '../Common/FloatingMenu';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

export type ProfileUserActionId = 'copyLink' | 'report' | 'block';

interface ProfileUserActionsMenuProps {
  open: boolean;
  onClose: () => void;
  anchor: FloatingMenuAnchor | null;
  username: string;
  title: string;
  labels: {
    copyLink: string;
    report: string;
    block: string;
  };
  isBlocked?: boolean;
  onAction: (action: ProfileUserActionId) => void;
}

const menuBtnClass =
  'flex w-full items-center gap-2 rounded-md p-2 text-left text-sm text-black transition-colors hover:bg-neutral-50';

const MenuAnimatedIcon: React.FC<{
  kind: 'copy' | 'headset' | 'lock';
  color?: string;
}> = ({ kind, color = '#000000' }) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);
  const size = 16;
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
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {kind === 'copy' ? (
        <CopyIcon {...shared} />
      ) : kind === 'headset' ? (
        <HeadsetIcon {...shared} />
      ) : (
        <LockIcon {...shared} />
      )}
    </span>
  );
};

const ProfileUserActionsMenu: React.FC<ProfileUserActionsMenuProps> = ({
  open,
  onClose,
  anchor,
  username,
  title,
  labels,
  isBlocked = false,
  onAction,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const rows: {
    id: ProfileUserActionId;
    label: string;
    icon: React.ReactNode;
    destructive?: boolean;
  }[] = [
    {
      id: 'copyLink',
      label: labels.copyLink,
      icon: <MenuAnimatedIcon kind="copy" />,
    },
    {
      id: 'report',
      label: labels.report,
      icon: <MenuAnimatedIcon kind="headset" />,
    },
    {
      id: 'block',
      label: labels.block,
      icon: (
        <MenuAnimatedIcon kind="lock" color={isBlocked ? '#525252' : '#000000'} />
      ),
      destructive: !isBlocked,
    },
  ];

  const handlePick = (id: ProfileUserActionId) => {
    onAction(id);
    onClose();
  };

  const list = (
    <div className="space-y-0.5">
      <p className="mb-3 text-center text-sm font-semibold text-neutral-900 lg:hidden">@{username}</p>
      {rows.map((row) => (
        <button
          key={row.id}
          type="button"
          role="menuitem"
          onClick={() => handlePick(row.id)}
          className={`${menuBtnClass} ${row.destructive ? 'text-red-600 hover:bg-red-50' : ''}`}
        >
          {row.icon}
          {row.label}
        </button>
      ))}
    </div>
  );

  if (isDesktop) {
    return (
      <FloatingMenu open={open} anchor={anchor} onClose={onClose} width={220}>
        {list}
      </FloatingMenu>
    );
  }

  return (
    <ResponsiveDialogShell open={open} onClose={onClose} title={title} sheetPadded>
      {list}
    </ResponsiveDialogShell>
  );
};

export default ProfileUserActionsMenu;
