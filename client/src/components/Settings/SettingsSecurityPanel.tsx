import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { USERS_API } from '../../config/api';

const SettingsSecurityPanel: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  const submitPassword = async () => {
    if (!token) return;
    if (newPassword.length < 6) {
      showToast(t('settings.securityPasswordTooShort'), 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast(t('settings.securityPasswordMismatch'), 'error');
      return;
    }
    try {
      setSaving(true);
      const res = await fetch(`${USERS_API}/me/password`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          typeof (data as { message?: string }).message === 'string'
            ? (data as { message: string }).message
            : t('settings.securityPasswordFailed'),
          'error',
        );
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast(t('settings.securityPasswordSuccess'));
    } catch {
      showToast(t('settings.securityPasswordFailed'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-bold">{t('settings.securityHeading')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.securityHint')}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">{t('settings.securityChangePassword')}</h3>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.securityCurrentPassword')}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.securityNewPassword')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.securityConfirmPassword')}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <button
            type="button"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            onClick={() => void submitPassword()}
            className="w-full rounded-xl bg-black py-3 font-medium text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            {saving ? t('settings.saving') : t('settings.securityUpdatePassword')}
          </button>
        </div>
      </section>

      <section className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div>
          <h3 className="font-semibold text-neutral-900">{t('settings.security2faTitle')}</h3>
          <p className="mt-1 text-sm text-neutral-500">{t('settings.security2faHint')}</p>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center pt-0.5">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={twoFactor}
            onChange={(e) => {
              setTwoFactor(e.target.checked);
              showToast(
                e.target.checked
                  ? t('settings.security2faEnabledToast')
                  : t('settings.security2faDisabledToast'),
              );
            }}
          />
          <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all peer-checked:bg-black peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/10" />
        </label>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <h3 className="font-semibold text-neutral-900">{t('settings.securitySessionsTitle')}</h3>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.securitySessionsHint')}</p>
        <div className="mt-4 rounded-xl bg-neutral-50 px-4 py-3">
          <p className="font-medium text-neutral-900">{t('settings.securityThisDevice')}</p>
          <p className="mt-0.5 text-sm text-neutral-500">{t('settings.securityActiveNow')}</p>
        </div>
      </section>
    </div>
  );
};

export default SettingsSecurityPanel;
