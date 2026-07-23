import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, QrCode, X } from 'lucide-react';
import type { IconHandle } from '@animateicons/react/lucide';
import { DownloadIcon, ScanIcon, ShareIcon } from './animateQrIcons';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { GradientScan, QRCode, type QRCodeHandle } from '../shared-assets/qr-code';
import { profilePath } from '../../constants/paths';
import { useTranslation } from '../../i18n/useTranslation';
import { useToast } from '../../context/ToastContext';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';

function profileAbsoluteUrl(username: string): string {
  const path = profilePath(username);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

const AnimatedActionIcon: React.FC<{
  kind: 'share' | 'download' | 'scan';
  size?: number;
  color?: string;
}> = ({ kind, size = 16, color = 'currentColor' }) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);

  const Icon = kind === 'share' ? ShareIcon : kind === 'download' ? DownloadIcon : ScanIcon;

  return (
    <span
      ref={nodeRef}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      <Icon
        ref={iconRef}
        size={size}
        duration={1}
        color={color}
        isAnimated={false}
        className="!h-full !w-full !min-h-0 !min-w-0"
      />
    </span>
  );
};

const ScanBeam: React.FC = () => (
  <div className="pointer-events-none absolute inset-[8%] overflow-hidden rounded-xl" aria-hidden>
    <div
      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#315efb] to-transparent shadow-[0_0_16px_3px_rgba(49,94,251,0.65)]"
      style={{ animation: 'mnoonx-qr-scan-beam 2.2s ease-in-out infinite' }}
    />
  </div>
);

const EnlargeStyles = () => (
  <style>{`
    @keyframes mnoonx-qr-scan-beam {
      0% { top: 8%; opacity: 0; }
      12% { opacity: 1; }
      88% { opacity: 1; }
      100% { top: 88%; opacity: 0; }
    }
    @keyframes mnoonx-qr-enlarge-fade {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes mnoonx-qr-enlarge-rise {
      from { opacity: 0; transform: translateY(28px) scale(0.92); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes mnoonx-qr-enlarge-glow {
      0%, 100% { opacity: 0.45; transform: scale(1); }
      50% { opacity: 0.75; transform: scale(1.06); }
    }
    @keyframes mnoonx-qr-enlarge-btn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);

interface ProfileQrCodeModalProps {
  open: boolean;
  onClose: () => void;
  username: string;
  fullName?: string;
}

export const ProfileQrCodeModal: React.FC<ProfileQrCodeModalProps> = ({
  open,
  onClose,
  username,
  fullName,
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const qrRef = useRef<QRCodeHandle>(null);
  const ignoreShellCloseRef = useRef(false);
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [scanFocus, setScanFocus] = useState(false);
  const url = useMemo(() => profileAbsoluteUrl(username), [username]);
  const displayName = fullName || username;
  const fileBase = `mnoonx-${username.replace(/[^a-zA-Z0-9_-]/g, '') || 'profile'}-qr`;

  useEffect(() => {
    if (!open) setScanFocus(false);
  }, [open]);

  useEffect(() => {
    if (!scanFocus) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        exitEnlarge();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey, true);
    };
  }, [scanFocus]);

  const openEnlarge = () => {
    // Closing the Vaul sheet programmatically fires onOpenChange(false) — ignore while enlarged.
    ignoreShellCloseRef.current = true;
    setScanFocus(true);
  };

  const exitEnlarge = () => {
    setScanFocus(false);
    window.requestAnimationFrame(() => {
      ignoreShellCloseRef.current = false;
    });
  };

  const handleShellClose = () => {
    if (ignoreShellCloseRef.current) return;
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('userProfile.menu.linkCopied'));
    } catch {
      showToast(t('userProfile.menu.linkCopied'), 'info');
    }
  };

  const saveAsPhoto = async () => {
    setBusy('save');
    try {
      await qrRef.current?.downloadPng(fileBase);
      showToast(t('userProfile.qr.saved'));
    } catch {
      showToast(t('userProfile.qr.saveFailed'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const shareProfile = async () => {
    setBusy('share');
    try {
      const title = t('userProfile.qr.shareTitle', { name: displayName });
      const text = t('userProfile.qr.shareText', { name: displayName });
      const blob = await qrRef.current?.getPngBlob();
      const file =
        blob != null
          ? new File([blob], `${fileBase}.png`, { type: 'image/png' })
          : null;

      if (
        file &&
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ title, text, url, files: [file] });
        return;
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({ title, text, url });
        return;
      }

      await copyLink();
      showToast(t('userProfile.qr.shareFallback'));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      showToast(t('userProfile.qr.shareFailed'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const enlargeScreen =
    open &&
    scanFocus &&
    typeof document !== 'undefined' &&
    createPortal(
      <div
        className="fixed inset-0 z-[400] flex h-[100dvh] w-screen flex-col bg-white text-neutral-900"
        style={{ animation: 'mnoonx-qr-enlarge-fade 280ms ease-out both' }}
        role="dialog"
        aria-modal="true"
        aria-label={t('userProfile.qr.enlarge')}
        data-qr-enlarge-root
      >
        <EnlargeStyles />

        {/* Soft brand wash */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute left-1/2 top-[38%] h-[min(70vw,28rem)] w-[min(70vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#315efb]/[0.12] blur-3xl"
            style={{ animation: 'mnoonx-qr-enlarge-glow 4s ease-in-out infinite' }}
          />
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <p
              className="mb-7 max-w-sm text-center text-sm font-medium tracking-wide text-neutral-500 sm:text-base"
              style={{ animation: 'mnoonx-qr-enlarge-btn 420ms ease-out 60ms both' }}
            >
              {t('userProfile.qr.scanHint')}
            </p>

            <div
              className="relative flex aspect-square w-[min(100vw-1.5rem,26rem)] items-center justify-center rounded-none border border-neutral-200 bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.08)] sm:w-[min(100vw-3rem,32rem)] sm:p-4"
              style={{ animation: 'mnoonx-qr-enlarge-rise 480ms cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <QRCode value={url} size="3xl" />
              <ScanBeam />
            </div>
          </div>

          <div
            className="relative z-20 shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4"
            style={{ animation: 'mnoonx-qr-enlarge-btn 480ms ease-out 140ms both' }}
          >
            <button
              type="button"
              onClick={exitEnlarge}
              onPointerDown={(e) => e.stopPropagation()}
              className="relative z-20 mx-auto flex w-full max-w-sm touch-manipulation items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[transform,background-color] duration-150 hover:bg-neutral-900 active:scale-[0.98] active:bg-neutral-800"
              aria-label={t('userProfile.qr.backFromScan')}
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              {t('userProfile.qr.backFromScan')}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <ResponsiveDialogShell
        open={open && !scanFocus}
        onClose={handleShellClose}
        title={t('userProfile.qr.title')}
        sheetPadded
        panelClassName="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-6 shadow-xl"
      >
        <div className="absolute right-3 top-3 z-20 hidden lg:right-4 lg:top-4 lg:block">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="relative flex min-h-[20rem] flex-col items-center text-center">
          <h2 className="text-lg font-bold text-neutral-900">{t('userProfile.qr.title')}</h2>
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={openEnlarge}
              className="inline-flex items-center gap-2 rounded-full border border-[#315efb]/25 bg-[#315efb]/[0.08] px-3.5 py-1.5 text-sm font-semibold text-[#315efb] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] transition-colors hover:border-[#315efb]/40 hover:bg-[#315efb]/15"
              aria-label={t('userProfile.qr.enlarge')}
            >
              <span className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-md bg-[#315efb] text-white">
                <AnimatedActionIcon kind="scan" size={13} color="#ffffff" />
              </span>
              <span>{t('userProfile.qr.enlarge')}</span>
            </button>
          </div>

          <div className="relative mt-5 flex aspect-square w-full max-w-[19rem] items-center justify-center">
            {open && !scanFocus ? <QRCode ref={qrRef} value={url} size="xl" /> : null}
            <div className="pointer-events-none absolute inset-0">
              <GradientScan className="absolute bottom-0 left-0 right-0" />
            </div>
          </div>

          <p className="mx-auto mt-4 max-w-xs break-all text-xs text-neutral-400">{url}</p>

          <div className="mt-5 grid w-full grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void shareProfile()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
            >
              <AnimatedActionIcon kind="share" size={16} color="#ffffff" />
              {busy === 'share' ? t('userProfile.qr.sharing') : t('userProfile.qr.share')}
            </button>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => void saveAsPhoto()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              <AnimatedActionIcon kind="download" size={16} color="currentColor" />
              {busy === 'save' ? t('userProfile.qr.saving') : t('userProfile.qr.savePhoto')}
            </button>
          </div>

          <button
            type="button"
            onClick={() => void copyLink()}
            className="mt-2 w-full rounded-2xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
          >
            {t('userProfile.menu.copyLink')}
          </button>
        </div>
      </ResponsiveDialogShell>

      {enlargeScreen}
    </>
  );
};

interface ProfileQrTriggerProps {
  onClick: () => void;
  size?: number;
}

/** QR icon button — place next to @username. */
export const ProfileQrTrigger: React.FC<ProfileQrTriggerProps> = ({ onClick, size = 18 }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center justify-center rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
      aria-label={t('userProfile.qr.openAria')}
      title={t('userProfile.qr.openAria')}
    >
      <QrCode size={size} strokeWidth={2} aria-hidden />
    </button>
  );
};
