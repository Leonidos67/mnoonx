import React, { useMemo, useRef, useState } from 'react';
import { Download, QrCode, Share2, X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import { GradientScan, QRCode, type QRCodeHandle } from '../shared-assets/qr-code';
import { profilePath } from '../../constants/paths';
import { useTranslation } from '../../i18n/useTranslation';
import { useToast } from '../../context/ToastContext';

function profileAbsoluteUrl(username: string): string {
  const path = profilePath(username);
  if (typeof window === 'undefined') return path;
  return `${window.location.origin}${path}`;
}

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
  const url = useMemo(() => profileAbsoluteUrl(username), [username]);
  const displayName = fullName || username;
  const fileBase = `mnoonx-${username.replace(/[^a-zA-Z0-9_-]/g, '') || 'profile'}-qr`;

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
      onClose={onClose}
      title={t('userProfile.qr.title')}
      sheetPadded
      panelClassName="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 hidden h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 lg:flex"
        aria-label={t('common.close')}
      >
        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>

      <div className="flex flex-col items-center text-center">
        <h2 className="text-lg font-bold text-neutral-900">{t('userProfile.qr.title')}</h2>
        <p className="mt-1 text-sm text-neutral-500">
          {displayName}
          <span className="text-neutral-400"> · @{username}</span>
        </p>

        <div className="relative mt-5 flex aspect-square w-full max-w-[15rem] items-center justify-center">
          {open ? <QRCode ref={qrRef} value={url} size="xl" /> : null}
          <GradientScan />
        </div>

        <p className="mt-4 max-w-xs break-all text-xs text-neutral-400">{url}</p>

        <div className="mt-5 grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void shareProfile()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#315efb] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4] disabled:opacity-50"
          >
            <Share2 className="h-4 w-4 shrink-0" aria-hidden />
            {busy === 'share' ? t('userProfile.qr.sharing') : t('userProfile.qr.share')}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void saveAsPhoto()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4 shrink-0" aria-hidden />
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
