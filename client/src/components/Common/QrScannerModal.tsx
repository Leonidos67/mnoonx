import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import type { IconHandle } from '@animateicons/react/lucide';
import { X } from 'lucide-react';
import ResponsiveDialogShell from './ResponsiveDialogShell';
import { ScanQrCodeIcon } from '../Profile/animateQrIcons';
import { useAnimateOnParentHover } from '../../hooks/useAnimateOnParentHover';
import { useTranslation } from '../../i18n/useTranslation';
import { parseQrScanPayload, type QrScanHit } from '../../utils/parseQrScan';

const AnimatedScanQrIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = 'currentColor',
}) => {
  const iconRef = useRef<IconHandle>(null);
  const nodeRef = useRef<HTMLSpanElement>(null);
  useAnimateOnParentHover(iconRef, nodeRef);

  return (
    <span
      ref={nodeRef}
      className="inline-flex shrink-0 items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      <ScanQrCodeIcon
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

function kindLabel(
  kind: QrScanHit['kind'],
  t: (key: string) => string
): string {
  if (kind === 'profile') return t('search.kindPerson');
  if (kind === 'community') return t('search.kindCommunity');
  if (kind === 'post') return t('search.kindPost');
  return t('search.qr.page');
}

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reactId = useId();
  const readerId = `qr-reader-${reactId.replace(/:/g, '')}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startingRef = useRef(false);
  const pausedRef = useRef(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hit, setHit] = useState<QrScanHit | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    startingRef.current = false;
    setScanning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
    } catch {
      /* ignore */
    }
    try {
      scanner.clear();
    } catch {
      /* ignore */
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (startingRef.current || pausedRef.current) return;
    startingRef.current = true;
    setCameraError(null);
    await stopScanner();

    const el = document.getElementById(readerId);
    if (!el) {
      startingRef.current = false;
      return;
    }

    const scanner = new Html5Qrcode(readerId, { verbose: false });
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (decoded) => {
          if (pausedRef.current) return;
          const parsed = parseQrScanPayload(decoded);
          if (!parsed) return;
          pausedRef.current = true;
          setHit(parsed);
          void stopScanner();
        },
        () => undefined
      );
      setScanning(true);
      startingRef.current = false;
    } catch {
      startingRef.current = false;
      setScanning(false);
      setCameraError(t('search.qr.cameraError'));
      try {
        scanner.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
  }, [readerId, stopScanner, t]);

  useEffect(() => {
    if (!open) {
      pausedRef.current = false;
      setHit(null);
      setCameraError(null);
      void stopScanner();
      return;
    }

    pausedRef.current = false;
    const timer = window.setTimeout(() => {
      void startScanner();
    }, 280);

    return () => {
      window.clearTimeout(timer);
      void stopScanner();
    };
    // Camera lifecycle is tied to open only — avoid restarting on callback identity churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = () => {
    pausedRef.current = false;
    void stopScanner();
    setHit(null);
    onClose();
  };

  const handleScanAgain = () => {
    pausedRef.current = false;
    setHit(null);
    setCameraError(null);
    window.setTimeout(() => {
      void startScanner();
    }, 120);
  };

  const handleGo = () => {
    if (!hit) return;
    const path = hit.path;
    void stopScanner();
    setHit(null);
    onClose();
    navigate(path);
  };

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={handleClose}
      title={t('search.qr.title')}
      sheetPadded
      panelClassName="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-5 shadow-xl sm:p-6"
      zIndexClass="z-[130]"
    >
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-center lg:pr-8">
            <h2 className="text-lg font-bold text-neutral-900">{t('search.qr.title')}</h2>
            <p className="mt-1 text-sm text-neutral-500">{t('search.qr.hint')}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950">
          <div id={readerId} className="min-h-[16rem] w-full overflow-hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

          {!hit && scanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-52 rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
          )}

          {cameraError && !hit && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/90 px-6 text-center">
              <p className="text-sm text-white/90">{cameraError}</p>
            </div>
          )}

          {hit && (
            <div className="absolute inset-0 flex items-end bg-black/55 p-4 backdrop-blur-[1px] sm:items-center sm:justify-center">
              <div className="w-full rounded-2xl bg-white p-4 shadow-xl sm:max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#315efb]">
                  {t('search.qr.found')}
                </p>
                <p className="mt-1 truncate text-base font-bold text-neutral-900">{hit.title}</p>
                <p className="mt-0.5 text-sm text-neutral-500">
                  {kindLabel(hit.kind, t)} · {hit.path}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleScanAgain}
                    className="rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    {t('search.qr.scanAgain')}
                  </button>
                  <button
                    type="button"
                    onClick={handleGo}
                    className="rounded-2xl bg-[#315efb] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2547c4]"
                  >
                    {t('search.qr.go')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ResponsiveDialogShell>
  );
};

export { AnimatedScanQrIcon };
export default QrScannerModal;
