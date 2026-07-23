import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, X } from 'lucide-react';
import ResponsiveDialogShell from './ResponsiveDialogShell';
import AnimatedExternalLinkIcon from './AnimatedExternalLinkIcon';
import { useTranslation } from '../../i18n/useTranslation';
import { getExternalHostname } from '../../utils/externalLinks';
import { LINK_OPEN_SETTINGS_PATH } from '../../utils/linkOpenPreferences';

interface ExternalLinkGateModalProps {
  open: boolean;
  url: string;
  onClose: () => void;
  onOpenHere: () => void;
  onOpenNewTab: () => void;
}

const ExternalLinkGateModal: React.FC<ExternalLinkGateModalProps> = ({
  open,
  url,
  onClose,
  onOpenHere,
  onOpenNewTab,
}) => {
  const { t } = useTranslation();
  const host = getExternalHostname(url);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={t('inAppBrowser.gateTitle')}
      sheetPadded
      role="alertdialog"
      zIndexClass="z-[140]"
      panelClassName="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#315efb]">
            <Globe className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-neutral-900">{t('inAppBrowser.gateTitle')}</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t('inAppBrowser.gateMessage')}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t('inAppBrowser.gateSettingsHint')}{' '}
              <Link
                to={LINK_OPEN_SETTINGS_PATH}
                onClick={onClose}
                className="font-medium text-[#315efb] underline-offset-2 hover:underline"
              >
                {t('inAppBrowser.gateSettingsLink')}
              </Link>
              {t('inAppBrowser.gateMessageAfter')}
            </p>
            <p className="mt-2 truncate text-xs font-medium text-neutral-400" title={url}>
              {host}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-xl p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onOpenNewTab}
          className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-neutral-200 px-3 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          <AnimatedExternalLinkIcon size={16} />
          {t('inAppBrowser.openNewTab')}
        </button>
        <button
          type="button"
          onClick={onOpenHere}
          className="flex-1 whitespace-nowrap rounded-xl bg-black px-3 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          {t('inAppBrowser.openHere')}
        </button>
      </div>
    </ResponsiveDialogShell>
  );
};

export default ExternalLinkGateModal;
