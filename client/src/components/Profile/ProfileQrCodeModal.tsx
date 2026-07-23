import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QrCode, X } from 'lucide-react';
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
  const [busy, setBusy] = useState<'share' | 'save' | null>(null);
  const [scanFocus, setScanFocus] = useState(false);
  const url = useMemo(() => profileAbsoluteUrl(username), [username]);
  const displayName = fullName || username;
  const fileBase = `mnoonx-${username.replace(/[^a-zA-Z0-9_-]/g, '') || 'profile'}-qr`;

  useEffect(() => {
    if (!open) setScanFocus(false);
  }, [open]);

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

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={() => {
        if (scanFocus) {
          setScanFocus(false);
          return;
        }
        onClose();
      }}
      title={t('userProfile.qr.title')}
      sheetPadded
      panelClassName={`relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-xl transition-[padding] duration-500 ${
        scanFocus ? 'p-4 sm:p-6' : 'p-6'
      }`}
    >
      <div className="absolute right-3 top-3 z-20 hidden items-center gap-0.5 lg:right-4 lg:top-4 lg:flex">
        <button
          type="button"
          onClick={() => setScanFocus((v) => !v)}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
            scanFocus
              ? 'bg-[#eef2ff] text-[#315efb]'
              : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600'
          }`}
          aria-label={t('userProfile.qr.scanAria')}
          aria-pressed={scanFocus}
          title={t('userProfile.qr.scanAria')}
        >
          <AnimatedActionIcon kind="scan" size={20} color="currentColor" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (scanFocus) setScanFocus(false);
            else onClose();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div
        className={`relative flex min-h-[20rem] flex-col items-center transition-colors duration-500 ${
          scanFocus ? 'justify-center bg-white' : 'text-center'
        }`}
      >
        <div
          className={`w-full overflow-hidden transition-all duration-500 ease-out ${
            scanFocus
              ? 'pointer-events-none max-h-0 -translate-y-2 opacity-0'
              : 'max-h-40 translate-y-0 opacity-100'
          }`}
        >
          <h2 className="pr-0 text-lg font-bold text-neutral-900 lg:pr-20">
            {t('userProfile.qr.title')}
          </h2>
          <button
            type="button"
            onClick={() => setScanFocus(true)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-sm font-medium text-[#315efb] transition-colors hover:bg-[#eef2ff]"
            aria-label={t('userProfile.qr.enlarge')}
          >
            <span>{t('userProfile.qr.enlarge')}</span>
            <AnimatedActionIcon kind="scan" size={16} color="#315efb" />
          </button>
        </div>

        <div
          className={`relative flex aspect-square items-center justify-center transition-all duration-500 ease-out ${
            scanFocus
              ? 'mt-0 w-full max-w-[18rem] scale-110 sm:max-w-[20rem] sm:scale-125'
              : 'mt-5 w-full max-w-[15rem] scale-100'
          }`}
        >
          {open ? <QRCode ref={qrRef} value={url} size="xl" /> : null}
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
              scanFocus ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <GradientScan className="absolute bottom-0 left-0 right-0" />
          </div>
        </div>

        <div
          className={`w-full overflow-hidden transition-all duration-500 ease-out ${
            scanFocus
              ? 'pointer-events-none max-h-0 translate-y-2 opacity-0'
              : 'max-h-60 translate-y-0 opacity-100'
          }`}
        >
          <p className="mt-4 max-w-xs break-all text-xs text-neutral-400 mx-auto">{url}</p>

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
      </div>
    </ResponsiveDialogShell>
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
