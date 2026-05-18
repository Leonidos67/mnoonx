import React from 'react';
import { X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';

interface AuthModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** Desktop: centered modal. Mobile (&lt;lg): Vaul bottom sheet. */
const AuthModalShell: React.FC<AuthModalShellProps> = ({ isOpen, onClose, title, children }) => (
  <ResponsiveDialogShell
    open={isOpen}
    onClose={onClose}
    title={title}
    sheetPadded
    zIndexClass="z-[100]"
    panelClassName="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-xl"
  >
    <button
      type="button"
      onClick={onClose}
      className="absolute right-4 top-4 hidden h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 lg:flex"
      aria-label="Close"
    >
      <X className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
    {children}
  </ResponsiveDialogShell>
);

export default AuthModalShell;
