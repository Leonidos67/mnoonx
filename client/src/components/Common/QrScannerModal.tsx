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

function kindLabel(kind: QrScanHit['kind'], t: (key: string) => string): string {
  if (kind === 'profile') return t('search.kindPerson');
  if (kind === 'community') return t('search.kindCommunity');
  if (kind === 'post') return t('search.kindPost');
  return t('search.qr.page');
}

/** Large viewfinder — corners sit farther from the QR in the center. */
const CameraViewfinder: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
    <div
      className="relative h-[min(82vw,22rem)] w-[min(82vw,22rem)] sm:h-[24rem] sm:w-[24rem]"
      style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }}
    >
      {/* Corner brackets */}
      <span className="absolute left-0 top-0 h-10 w-10 border-l-[3px] border-t-[3px] border-white sm:h-12 sm:w-12" />
      <span className="absolute right-0 top-0 h-10 w-10 border-r-[3px] border-t-[3px] border-white sm:h-12 sm:w-12" />
      <span className="absolute bottom-0 left-0 h-10 w-10 border-b-[3px] border-l-[3px] border-white sm:h-12 sm:w-12" />
      <span className="absolute bottom-0 right-0 h-10 w-10 border-b-[3px] border-r-[3px] border-white sm:h-12 sm:w-12" />

      {/* Brand accent ticks */}
      <span className="absolute left-0 top-0 h-3 w-3 border-l-[3px] border-t-[3px] border-[#315efb]" />
      <span className="absolute right-0 top-0 h-3 w-3 border-r-[3px] border-t-[3px] border-[#315efb]" />
      <span className="absolute bottom-0 left-0 h-3 w-3 border-b-[3px] border-l-[3px] border-[#315efb]" />
      <span className="absolute bottom-0 right-0 h-3 w-3 border-b-[3px] border-r-[3px] border-[#315efb]" />

      {/* Moving scan beam */}
      <div className="absolute inset-x-4 inset-y-5 overflow-hidden sm:inset-x-5 sm:inset-y-6">
        <div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#315efb] to-transparent shadow-[0_0_14px_2px_rgba(49,94,251,0.7)]"
          style={{ animation: 'mnoonx-cam-scan-beam 2.4s ease-in-out infinite' }}
        />
      </div>
    </div>

    <style>{`
      @keyframes mnoonx-cam-scan-beam {
        0% { top: 6%; opacity: 0; }
        12% { opacity: 1; }
        88% { opacity: 1; }
        100% { top: 90%; opacity: 0; }
      }
    `}</style>
  </div>
);

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  /** Prefer this over internal navigate so parents can dismiss search UI first. */
  onGoToPage?: (path: string) => void;
}

const QrScannerModal: React.FC<QrScannerModalProps> = ({ open, onClose, onGoToPage }) => {
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

    const boxSize = Math.min(Math.floor(window.innerWidth * 0.78), 360);

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: boxSize, height: boxSize },
          aspectRatio: 1,
          disableFlip: false,
        },
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
    if (onGoToPage) onGoToPage(path);
    else navigate(path);
  };

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={handleClose}
      title={t('search.qr.title')}
      sheetPadded={false}
      sheetContentClassName="!h-[96dvh] !max-h-[96dvh] !bg-neutral-950 [&_.bg-neutral-300]:!bg-neutral-600"
      panelClassName="relative flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-neutral-950 p-4 shadow-xl sm:p-5"
      zIndexClass="z-[130]"
    >
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="relative z-10 mb-3 shrink-0">
          <div className="min-w-0 pr-10 text-center">
            <h2 className="text-lg font-bold text-white">{t('search.qr.title')}</h2>
            <p className="mt-1 text-sm text-white/55">{t('search.qr.hint')}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          <div
            id={readerId}
            className={[
              'h-full min-h-[min(68dvh,32rem)] w-full overflow-hidden',
              // Hide html5-qrcode chrome; keep only the video feed
              '[&_img]:hidden',
              '[&_video]:absolute [&_video]:inset-0 [&_video]:h-full [&_video]:min-h-full [&_video]:w-full [&_video]:object-cover',
              '[&_#qr-shaded-region]:!hidden',
              '[&_[id*="qr-shaded"]]:!hidden',
              '[&_div]:!border-0',
            ].join(' ')}
          />

          {!hit && scanning && <CameraViewfinder />}

          {!hit && scanning && (
            <p className="pointer-events-none absolute inset-x-0 bottom-5 z-[2] text-center text-xs font-medium tracking-wide text-white/70">
              {t('search.qr.hint')}
            </p>
          )}

          {cameraError && !hit && (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-neutral-950/90 px-6 text-center">
              <p className="text-sm text-white/90">{cameraError}</p>
            </div>
          )}

          {hit && (
            <div className="absolute inset-0 z-[3] flex items-end bg-black/60 p-4 backdrop-blur-[2px] sm:items-center sm:justify-center">
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
