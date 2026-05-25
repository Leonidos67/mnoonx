import React from 'react';
import { Ban, Flag, MessageCircle, Unlink2 } from 'lucide-react';
import FloatingMenu, { type FloatingMenuAnchor } from '../Common/FloatingMenu';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export type ProfileUserActionId = 'message' | 'copyLink' | 'report' | 'block';

interface ProfileUserActionsMenuProps {
  open: boolean;
  onClose: () => void;
  anchor: FloatingMenuAnchor | null;
  username: string;
  title: string;
  labels: {
    sendMessage: string;
    copyLink: string;
    report: string;
    block: string;
  };
  onAction: (action: ProfileUserActionId) => void;
}

const menuBtnClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-neutral-900 transition-colors hover:bg-neutral-50';

const ProfileUserActionsMenu: React.FC<ProfileUserActionsMenuProps> = ({
  open,
  onClose,
  anchor,
  username,
  title,
  labels,
  onAction,
}) => {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const rows: { id: ProfileUserActionId; label: string; icon: React.ReactNode; destructive?: boolean }[] = [
    {
      id: 'message',
      label: labels.sendMessage,
      icon: <MessageCircle className="h-5 w-5 shrink-0 text-neutral-700" aria-hidden />,
    },
    {
      id: 'copyLink',
      label: labels.copyLink,
      icon: <Unlink2 className="h-5 w-5 shrink-0 text-neutral-700" aria-hidden />,
    },
    {
      id: 'report',
      label: labels.report,
      icon: <Flag className="h-5 w-5 shrink-0 text-neutral-700" aria-hidden />,
    },
    {
      id: 'block',
      label: labels.block,
      icon: <Ban className="h-5 w-5 shrink-0 text-neutral-700" aria-hidden />,
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
