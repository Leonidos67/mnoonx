import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTranslation } from '../../i18n/useTranslation';

const OfflineOverlay: React.FC = () => {
  const { isOffline, retryConnection } = useNetworkStatus();
  const { t } = useTranslation();

  if (!isOffline) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-white p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-overlay-title"
      aria-describedby="offline-overlay-desc"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <WifiOff className="h-7 w-7" strokeWidth={1.75} aria-hidden />
        </div>
        <h2 id="offline-overlay-title" className="mt-5 text-center text-xl font-bold text-neutral-900">
          {t('common.offlineTitle')}
        </h2>
        <p id="offline-overlay-desc" className="mt-2 text-center text-sm leading-relaxed text-neutral-600 sm:text-base">
          {t('common.offlineMessage')}
        </p>
        <button
          type="button"
          onClick={retryConnection}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 active:scale-[0.99]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t('common.offlineRetry')}
        </button>
      </div>
    </div>
  );
};

export default OfflineOverlay;
