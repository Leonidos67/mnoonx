import React, { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { AUTH_API } from '../../config/api';
import AuthModalShell from './AuthModalShell';
import OtpCodeInput from './OtpCodeInput';
import { authInputClass, authSubmitClass } from './authFormStyles';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

type LoginView =
  | 'login'
  | 'forgot-email'
  | 'forgot-code'
  | 'forgot-password'
  | 'forgot-success';

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login, complete2faLogin } = useAuth();
  const { t, locale } = useTranslation();
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setView('login');
      setEmail('');
      setPassword('');
      setResetCode('');
      setNewPassword('');
      setConfirmPassword('');
      setTotpCode('');
      setTempToken(null);
      setInfo('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const goBackToLogin = () => {
    setView('login');
    setError('');
    setInfo('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (view === 'forgot-email') {
        const res = await fetch(`${AUTH_API}/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), locale }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { message?: string }).message || t('auth.forgotSendFailed'));
        }
        setInfo(t('auth.forgotEmailSent'));
        setResetCode('');
        setView('forgot-code');
        return;
      }

      if (view === 'forgot-code') {
        if (!/^\d{6}$/.test(resetCode)) {
          throw new Error(t('auth.resetCodeIncomplete'));
        }
        const res = await fetch(`${AUTH_API}/verify-reset-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), code: resetCode }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { message?: string }).message || t('auth.resetPasswordFailed'));
        }
        setInfo('');
        setView('forgot-password');
        return;
      }

      if (view === 'forgot-password') {
        if (newPassword.length < 6) {
          throw new Error(t('auth.resetPasswordTooShort'));
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t('auth.resetPasswordMismatch'));
        }
        const res = await fetch(`${AUTH_API}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            code: resetCode.trim(),
            newPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error((data as { message?: string }).message || t('auth.resetPasswordFailed'));
        }
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setView('forgot-success');
        return;
      }

      if (tempToken) {
        await complete2faLogin(tempToken, totpCode);
        onClose();
        return;
      }
      const result = await login(email, password);
      if (!result.ok && result.requires2fa) {
        setTempToken(result.tempToken);
        return;
      }
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('auth.loginFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const title =
    tempToken
      ? t('auth.twoFactorTitle')
      : view === 'forgot-email'
        ? t('auth.forgotTitle')
        : view === 'forgot-code'
          ? t('auth.resetCodeTitle')
          : view === 'forgot-password'
            ? t('auth.resetPasswordTitle')
            : view === 'forgot-success'
              ? t('auth.resetSuccessTitle')
              : t('auth.welcomeBack');

  const submitLabel = loading
    ? t('auth.processing')
    : tempToken
      ? t('auth.verifyCode')
      : view === 'forgot-email'
        ? t('auth.sendResetCode')
        : view === 'forgot-code'
          ? t('auth.verifyCode')
          : view === 'forgot-password'
            ? t('auth.resetPassword')
            : t('auth.logIn');

  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title={t('auth.loginTitle')}>
      {view === 'forgot-success' ? (
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/30">
              <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
            </div>
          </div>
          <h2
            id="auth-modal-title"
            className="mb-2 text-2xl font-bold text-neutral-900 sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mb-8 max-w-xs text-sm leading-relaxed text-neutral-500">
            {t('auth.resetPasswordSuccess')}
          </p>
          <button type="button" onClick={goBackToLogin} className={authSubmitClass}>
            {t('auth.backToLogin')}
          </button>
        </div>
      ) : (
        <>
          <h2
            id="auth-modal-title"
            className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:mb-8 sm:text-3xl"
          >
            {title}
          </h2>

          {view === 'forgot-email' && (
            <p className="mb-4 text-center text-sm text-neutral-500">{t('auth.forgotHint')}</p>
          )}
          {view === 'forgot-code' && (
            <p className="mb-4 text-center text-sm text-neutral-500">
              {t('auth.resetCodeHint', { email: email.trim() })}
            </p>
          )}
          {view === 'forgot-password' && (
            <p className="mb-4 text-center text-sm text-neutral-500">{t('auth.resetPasswordHint')}</p>
          )}

          {error && (
            <p className="mb-4 text-center text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          {info && view !== 'forgot-password' && (
            <p className="mb-4 text-center text-sm text-emerald-600" role="status">
              {info}
            </p>
          )}

          <form onSubmit={(e) => void handleSubmit(e)}>
            {tempToken ? (
              <OtpCodeInput
                value={totpCode}
                onChange={setTotpCode}
                disabled={loading}
                autoFocus
                error={Boolean(error)}
                aria-label={t('auth.twoFactorCode')}
              />
            ) : view === 'forgot-email' ? (
              <input
                type="email"
                placeholder={t('auth.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${authInputClass} mb-6`}
                autoComplete="email"
                required
              />
            ) : view === 'forgot-code' ? (
              <OtpCodeInput
                value={resetCode}
                onChange={(v) => {
                  setResetCode(v);
                  if (error) setError('');
                }}
                disabled={loading}
                autoFocus
                error={Boolean(error)}
                aria-label={t('auth.resetCode')}
              />
            ) : view === 'forgot-password' ? (
              <>
                <input
                  type="password"
                  placeholder={t('auth.newPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${authInputClass} mb-4`}
                  autoComplete="new-password"
                  required
                />
                <input
                  type="password"
                  placeholder={t('auth.confirmNewPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${authInputClass} mb-6`}
                  autoComplete="new-password"
                  required
                />
              </>
            ) : (
              <>
                <input
                  type="email"
                  placeholder={t('auth.email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${authInputClass} mb-4`}
                  autoComplete="email"
                  required
                />
                <input
                  type="password"
                  placeholder={t('auth.password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${authInputClass} mb-2`}
                  autoComplete="current-password"
                  required
                />
                <div className="mb-6 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot-email');
                      setError('');
                      setInfo('');
                    }}
                    className="text-sm font-medium text-[#315efb] hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                (view === 'forgot-code' && resetCode.length !== 6) ||
                (Boolean(tempToken) && totpCode.length !== 6)
              }
              className={authSubmitClass}
            >
              {submitLabel}
            </button>
          </form>

          {!tempToken && view === 'login' ? (
            <p className="mt-6 text-center text-sm text-gray-500">
              {t('auth.noAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium text-[#315efb] hover:underline"
              >
                {t('common.signUp')}
              </button>
            </p>
          ) : !tempToken &&
            (view === 'forgot-email' || view === 'forgot-code' || view === 'forgot-password') ? (
            <button
              type="button"
              className="mt-4 w-full text-center text-sm text-neutral-500 hover:underline"
              onClick={() => {
                if (view === 'forgot-password') {
                  setView('forgot-code');
                  setError('');
                  setInfo('');
                  return;
                }
                if (view === 'forgot-code') {
                  setView('forgot-email');
                  setError('');
                  setInfo('');
                  setResetCode('');
                  return;
                }
                goBackToLogin();
              }}
            >
              {view === 'forgot-email' ? t('auth.backToLogin') : t('common.back')}
            </button>
          ) : tempToken ? (
            <button
              type="button"
              className="mt-4 w-full text-center text-sm text-neutral-500 hover:underline"
              onClick={() => {
                setTempToken(null);
                setTotpCode('');
                setError('');
              }}
            >
              {t('common.back')}
            </button>
          ) : null}
        </>
      )}
    </AuthModalShell>
  );
};

export default LoginModal;
