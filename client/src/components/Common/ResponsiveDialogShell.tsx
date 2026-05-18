import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import MobileBottomSheet from './MobileBottomSheet';

const LG_MEDIA = '(min-width: 1024px)';

export interface ResponsiveDialogShellProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name for screen readers */
  title: string;
  children: React.ReactNode;
  /** Mobile sheet: wrap content with default horizontal padding */
  sheetPadded?: boolean;
  /** Desktop dialog panel classes */
  panelClassName?: string;
  zIndexClass?: string;
  role?: 'dialog' | 'alertdialog';
  closeOnBackdrop?: boolean;
  /** Blocks backdrop / swipe dismiss while true */
  disableClose?: boolean;
}

/** Desktop: centered modal. Mobile (&lt;lg): Vaul bottom sheet. */
const ResponsiveDialogShell: React.FC<ResponsiveDialogShellProps> = ({
  open,
  onClose,
  title,
  children,
  sheetPadded = false,
  panelClassName = 'w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl',
  zIndexClass = 'z-[120]',
  role = 'dialog',
  closeOnBackdrop = true,
  disableClose = false,
}) => {
  const isDesktop = useMediaQuery(LG_MEDIA);

  const tryClose = () => {
    if (!disableClose) onClose();
  };

  return (
    <>
      {isDesktop && open && (
        <div
          className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]`}
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && closeOnBackdrop) tryClose();
          }}
        >
          <div
            role={role}
            aria-modal="true"
            className={panelClassName}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      )}
      <MobileBottomSheet
        open={open}
        onClose={tryClose}
        title={title}
        padded={sheetPadded}
        dismissible={!disableClose}
      >
        {children}
      </MobileBottomSheet>
    </>
  );
};

export default ResponsiveDialogShell;
