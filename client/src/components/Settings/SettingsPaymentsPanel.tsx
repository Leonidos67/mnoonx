import React, { useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';

const SettingsPaymentsPanel: React.FC = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [defaultCurrency, setDefaultCurrency] = useState<'USD' | 'EUR'>('USD');

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold">{t('settings.paymentsHeading')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.paymentsHint')}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-neutral-900">{t('settings.paymentsMethodsTitle')}</h3>
          <button
            type="button"
            onClick={() => showToast(t('settings.paymentsAddSoon'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
          >
            <Plus className="h-4 w-4" />
            {t('settings.paymentsAdd')}
          </button>
        </div>
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
          <CreditCard className="mb-3 h-8 w-8 text-neutral-400" aria-hidden />
          <p className="font-medium text-neutral-900">{t('settings.paymentsEmptyTitle')}</p>
          <p className="mt-1 max-w-xs text-sm text-neutral-500">{t('settings.paymentsEmptyBody')}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">{t('settings.paymentsCurrencyTitle')}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.paymentsCurrencyHint')}</p>
        <div className="mt-4 flex gap-2">
          {(['USD', 'EUR'] as const).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setDefaultCurrency(code)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                defaultCurrency === code
                  ? 'bg-black text-white'
                  : 'border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">{t('settings.paymentsBillingTitle')}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.paymentsBillingHint')}</p>
        <p className="mt-4 rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
          {t('settings.paymentsNoBilling')}
        </p>
      </section>
    </div>
  );
};

export default SettingsPaymentsPanel;
