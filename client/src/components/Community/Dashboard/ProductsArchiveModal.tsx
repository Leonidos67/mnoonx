import React from 'react';
import { Archive, RotateCcw, Trash2, X } from 'lucide-react';
import ResponsiveDialogShell from '../../Common/ResponsiveDialogShell';
import { getDashboardAppLabel } from './dashboardAppMeta';
import { useTranslation } from '../../../i18n/useTranslation';

export type ArchivedProductItem = {
  id: string;
  appId: string;
  title: string;
  archivedAt?: string | null;
};

type ProductsArchiveModalProps = {
  open: boolean;
  items: ArchivedProductItem[];
  busyId: string | null;
  onClose: () => void;
  onRestore: (instanceId: string) => void;
  onDeleteForever: (instanceId: string) => void;
};

const ProductsArchiveModal: React.FC<ProductsArchiveModalProps> = ({
  open,
  items,
  busyId,
  onClose,
  onRestore,
  onDeleteForever,
}) => {
  const { t } = useTranslation();

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={t('communityDashboard.products.archiveTitle')}
      zIndexClass="z-[130]"
      panelClassName="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      sheetContentClassName="max-h-[90dvh]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-2">
        <div>
          <h2 className="mt-1 text-xl font-bold text-neutral-900">
            {t('communityDashboard.products.archiveTitle')}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">
            {t('communityDashboard.products.archiveEmpty')}
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
            {items.map((item) => {
              const busy = busyId === item.id;
              return (
                <li key={item.id} className="flex items-center gap-3 px-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900">{item.title}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {getDashboardAppLabel(item.appId, t)}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onRestore(item.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                    {t('communityDashboard.products.restore')}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onDeleteForever(item.id)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t('communityDashboard.products.deleteForever')}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ResponsiveDialogShell>
  );
};

export default ProductsArchiveModal;
