import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3800;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
        <Check className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }
  if (variant === 'error') {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-5 w-5" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#315efb]">
      <Info className="h-5 w-5" strokeWidth={2.25} aria-hidden />
    </span>
  );
}

const ToastViewport: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-6 z-[200] flex w-[min(100vw-2rem,380px)] flex-col gap-3"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="toast-enter pointer-events-auto flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white/95 px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
        >
          <ToastIcon variant={toast.variant} />
          <p className="min-w-0 flex-1 pt-1.5 text-sm font-medium leading-snug text-neutral-900">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
