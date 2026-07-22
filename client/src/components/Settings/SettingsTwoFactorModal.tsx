import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import ResponsiveDialogShell from '../Common/ResponsiveDialogShell';
import OtpCodeInput from '../Auth/OtpCodeInput';
import { useTranslation } from '../../i18n/useTranslation';

export type TwoFactorModalMode = 'setup' | 'disable';

interface SettingsTwoFactorModalProps {
  open: boolean;
  mode: TwoFactorModalMode | null;
  busy: boolean;
  qrUrl: string;
  secret: string;
  onClose: () => void;
  onConfirmEnable: (code: string) => Promise<void> | void;
  onConfirmDisable: (payload: { code?: string; password?: string }) => Promise<void> | void;
}

const passwordInputClass =
  'w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10';

const SettingsTwoFactorModal: React.FC<SettingsTwoFactorModalProps> = ({
  open,
  mode,
  busy,
  qrUrl,
  secret,
  onClose,
  onConfirmEnable,
  onConfirmDisable,
}) => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setCode('');
      setPassword('');
      setError('');
    }
  }, [open, mode]);

  if (!mode) return null;

  const title =
    mode === 'setup' ? t('settings.security2faSetupModalTitle') : t('settings.security2faDisableModalTitle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'setup') {
      if (code.length !== 6) {
        setError(t('auth.resetCodeIncomplete'));
        return;
      }
      try {
        await onConfirmEnable(code);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('settings.security2faInvalidCode'));
      }
      return;
    }

    if (!code.trim() && !password.trim()) {
      setError(t('settings.security2faDisableRequireProof'));
      return;
    }
    try {
      await onConfirmDisable({
        code: code.trim() || undefined,
        password: password.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('settings.security2faInvalidCode'));
    }
  };

  return (
    <ResponsiveDialogShell
      open={open}
      onClose={onClose}
      title={title}
      sheetPadded
      disableClose={busy}
      panelClassName="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        disabled={busy}
        className="absolute right-4 top-4 hidden h-9 w-9 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50 lg:flex"
        aria-label={t('common.cancel')}
      >
        <X className="h-5 w-5" strokeWidth={2} aria-hidden />
      </button>

      <h2 className="mb-2 pr-8 text-center text-xl font-bold text-neutral-900 sm:text-2xl">{title}</h2>
      <p className="mb-6 text-center text-sm leading-relaxed text-neutral-500">
        {mode === 'setup' ? t('settings.security2faScanHint') : t('settings.security2faDisableHint')}
      </p>

      {error ? (
        <p className="mb-4 text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={(e) => void handleSubmit(e)}>
        {mode === 'setup' ? (
          <div className="mb-6 flex flex-col items-center gap-4">
            <div className="shrink-0">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt=""
                  className="h-40 w-40 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                  <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
                </div>
              )}
            </div>
            {secret ? (
              <div className="w-full">
                <p className="mb-1.5 text-center text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {t('settings.security2faManualKey')}
                </p>
                <code className="block break-all rounded-xl bg-neutral-50 px-3 py-2.5 text-center text-xs text-neutral-700 ring-1 ring-neutral-200/80">
                  {secret}
                </code>
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="mb-2 text-center text-sm font-medium text-neutral-700">
          {t('settings.security2faCodeLabel')}
        </p>
        <OtpCodeInput
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError('');
          }}
          disabled={busy}
          autoFocus
          error={Boolean(error) && mode === 'setup'}
          aria-label={t('settings.security2faCodeLabel')}
        />

        {mode === 'disable' ? (
          <>
            <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-neutral-400">
              {t('settings.security2faOr')}
            </p>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.securityCurrentPassword')}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              disabled={busy}
              className={`${passwordInputClass} mb-6`}
            />
          </>
        ) : null}

        <button
          type="submit"
          disabled={
            busy ||
            (mode === 'setup' && code.length !== 6) ||
            (mode === 'disable' && !code.trim() && !password.trim())
          }
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
            mode === 'disable'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-black hover:bg-neutral-800'
          }`}
        >
          {busy
            ? t('settings.saving')
            : mode === 'setup'
              ? t('settings.security2faConfirmEnable')
              : t('settings.security2faConfirmDisable')}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="mt-3 w-full text-center text-sm text-neutral-500 hover:underline disabled:opacity-50"
        >
          {t('common.cancel')}
        </button>
      </form>
    </ResponsiveDialogShell>
  );
};

export default SettingsTwoFactorModal;
