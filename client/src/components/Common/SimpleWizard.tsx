import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

export interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
}

interface SimpleWizardProps {
  steps: WizardStep[];
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
  canNext: boolean;
  nextLabel?: string;
  finishLabel?: string;
  loading?: boolean;
  headerLabel?: string;
  children: React.ReactNode;
}

const SimpleWizard: React.FC<SimpleWizardProps> = ({
  steps,
  stepIndex,
  onBack,
  onNext,
  canNext,
  nextLabel = 'Continue',
  finishLabel = 'Finish',
  loading = false,
  headerLabel,
  children,
}) => {
  const { t } = useTranslation();
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const progress = ((stepIndex + 1) / steps.length) * 100;
  const Box = 'div' as const;

  return (
    <Box className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <Box className="shrink-0 border-b border-[#ececec] px-4 py-3">
        <Box className="mx-auto flex max-w-[760px] items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full p-2 text-neutral-700 transition-colors hover:bg-black/5"
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Box className="min-w-0 flex-1">
            {headerLabel && (
              <p className="text-xs font-semibold uppercase tracking-wide text-[#888]">{headerLabel}</p>
            )}
            <p className="text-sm font-medium text-neutral-800">
              {t('newPage.wizard.stepOf', { current: stepIndex + 1, total: steps.length })}
            </p>
          </Box>
        </Box>
        <Box className="mx-auto mt-3 h-1 max-w-[760px] overflow-hidden rounded-full bg-[#ececec]">
          <Box
            className="h-full rounded-full bg-[#315efb] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </Box>
      </Box>

      <Box className="min-h-0 flex-1 overflow-y-auto px-6 py-10">
        <Box className="mx-auto max-w-[760px]">
          <h1 className="text-[40px] font-semibold leading-none tracking-[-0.04em] text-black sm:text-[48px]">
            {step.title}
          </h1>
          {step.subtitle && (
            <p className="mt-4 max-w-[620px] text-[17px] leading-relaxed text-[#666]">{step.subtitle}</p>
          )}
          <Box className="mt-10">{children}</Box>
        </Box>
      </Box>

      <Box className="shrink-0 border-t border-[#ececec] bg-white px-6 py-4">
        <Box className="mx-auto flex max-w-[760px] gap-3">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="h-12 flex-1 rounded-2xl border border-[#e5e5e5] text-[15px] font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
            >
              {t('common.back')}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={!canNext || loading}
            className="h-12 flex-[2] rounded-2xl bg-black text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? t('newPage.wizard.pleaseWait')
              : isLast
                ? finishLabel
                : nextLabel ?? t('newPage.wizard.continue')}
          </button>
        </Box>
      </Box>
    </Box>
  );
};

export default SimpleWizard;
