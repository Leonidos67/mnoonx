import React from 'react';
import { Package, Receipt } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

const SettingsOrdersPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold">{t('settings.ordersHeading')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.ordersHint')}</p>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-14 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-neutral-400 shadow-sm">
          <Package className="h-7 w-7" aria-hidden />
        </div>
        <p className="text-lg font-semibold text-neutral-900">{t('settings.ordersEmptyTitle')}</p>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">{t('settings.ordersEmptyBody')}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-neutral-500" aria-hidden />
          <h3 className="font-semibold text-neutral-900">{t('settings.ordersHistoryTitle')}</h3>
        </div>
        <p className="mt-2 text-sm text-neutral-500">{t('settings.ordersHistoryHint')}</p>
        <ul className="mt-4 divide-y divide-neutral-100 rounded-xl border border-neutral-100">
          <li className="px-4 py-6 text-center text-sm text-neutral-400">
            {t('settings.ordersNoHistory')}
          </li>
        </ul>
      </section>
    </div>
  );
};

export default SettingsOrdersPanel;
