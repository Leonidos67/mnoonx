import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import ResponsiveDialogShell from '../../Common/ResponsiveDialogShell';
import { useTranslation } from '../../../i18n/useTranslation';

export type ProductSettingsValues = {
  title: string;
  note: string;
};

type ProductSettingsModalProps = {
  open: boolean;
  initialTitle: string;
  initialNote?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: ProductSettingsValues) => void;
};

/** Shared modal for «Settings» and «Edit» — title + description. */
const ProductSettingsModal: React.FC<ProductSettingsModalProps> = ({
  open,
  initialTitle,
  initialNote = '',
  saving = false,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState(initialTitle);
  const [note, setNote] = useState(initialNote);

  useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setNote(initialNote);
  }, [open, initialTitle, initialNote]);

  const trimmedTitle = title.trim();
  const trimmedNote = note.trim();
  const unchanged =
    trimmedTitle === initialTitle.trim() && trimmedNote === (initialNote || '').trim();
  const canSubmit = trimmedTitle.length > 0 && !unchanged && !saving;

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={t('communityDashboard.products.settingsTitle')}
      disableClose={saving}
      zIndexClass="z-[130]"
      panelClassName="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      sheetPadded
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">
            {t('communityDashboard.products.settingsTitle')}
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {t('communityDashboard.products.settingsDescription')}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          onSubmit({ title: trimmedTitle, note: trimmedNote });
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">
            {t('communityDashboard.products.settingsNameLabel')}
          </span>
          <input
            type="text"
            value={title}
            maxLength={120}
            disabled={saving}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-xl border border-neutral-200 px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            placeholder={t('communityDashboard.products.settingsNamePlaceholder')}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-neutral-700">
            {t('communityDashboard.products.settingsNoteLabel')}
          </span>
          <textarea
            value={note}
            maxLength={500}
            disabled={saving}
            rows={4}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-900 outline-none focus:border-neutral-400"
            placeholder={t('communityDashboard.products.settingsNotePlaceholder')}
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-10 rounded-xl px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-10 rounded-xl bg-[#315efb] px-4 text-sm font-medium text-white hover:bg-[#2748c9] disabled:opacity-40"
          >
            {saving ? t('common.saving') : t('communityDashboard.products.settingsSave')}
          </button>
        </div>
      </form>
    </ResponsiveDialogShell>
  );
};

export default ProductSettingsModal;
