import React from 'react';
import { Drawer } from 'vaul';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const LG_MEDIA = '(min-width: 1024px)';

export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for screen readers */
  title: string;
  children: React.ReactNode;
  /** Adds default horizontal padding and scroll (auth forms). Off for full-height panels (post detail). */
  padded?: boolean;
  /** Allow swipe / backdrop dismiss. Default true. */
  dismissible?: boolean;
  /** Extra classes on the drawer surface */
  contentClassName?: string;
  zIndexClass?: string;
}

/** Vaul bottom sheet — only on viewports below `lg`. */
const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  padded = false,
  dismissible = true,
  contentClassName = '',
  zIndexClass = 'z-[100]',
}) => {
  const isDesktop = useMediaQuery(LG_MEDIA);

  if (isDesktop) return null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(nextOpen: boolean) => {
        if (!nextOpen) onClose();
      }}
      dismissible={dismissible}
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className={`fixed inset-0 ${zIndexClass} bg-black/60`} />
        <Drawer.Content
          className={`fixed inset-x-0 bottom-0 ${zIndexClass} flex max-h-[92dvh] flex-col rounded-t-[20px] bg-white outline-none ${contentClassName}`}
          aria-describedby={undefined}
        >
          <Drawer.Title className="sr-only">{title}</Drawer.Title>
          <Drawer.Handle className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-neutral-300" />
          {padded ? (
            <div className="overflow-y-auto overscroll-contain px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
              {children}
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
              {children}
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobileBottomSheet;
