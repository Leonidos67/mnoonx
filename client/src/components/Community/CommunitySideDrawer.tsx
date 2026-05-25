import React from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const LG_MEDIA = '(min-width: 1024px)';

export interface CommunitySideDrawerProps {
  side: 'left' | 'right';
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Slide-over panel for community side columns on viewports below `lg`. */
const CommunitySideDrawer: React.FC<CommunitySideDrawerProps> = ({
  side,
  open,
  onClose,
  title,
  children,
}) => {
  const isDesktop = useMediaQuery(LG_MEDIA);
  if (isDesktop) return null;

  const widthClass = side === 'left' ? 'w-[min(88vw,280px)]' : 'w-[min(92vw,340px)]';
  const positionClass =
    side === 'left'
      ? 'left-0 rounded-r-[20px]'
      : 'right-0 rounded-l-[20px]';

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      direction={side}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[100] bg-black/50" />
        <Drawer.Content
          className={`fixed inset-y-0 z-[101] flex flex-col bg-white outline-none ${positionClass} ${widthClass}`}
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <div className="flex shrink-0 items-center justify-between border-b border-[#ececec] px-4 py-3">
            <span className="text-base font-semibold text-neutral-900">{title}</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default CommunitySideDrawer;
