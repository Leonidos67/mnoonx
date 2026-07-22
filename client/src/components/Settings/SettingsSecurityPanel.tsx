import React, { useCallback, useEffect, useState } from 'react';
import { Globe, KeyRound, Loader2, Monitor, ShieldCheck } from 'lucide-react';
import SettingsToggleRow from './SettingsToggleRow';
import SettingsTwoFactorModal, { type TwoFactorModalMode } from './SettingsTwoFactorModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { AUTH_API, USERS_API } from '../../config/api';
import {
  getLinkOpenPreference,
  setLinkOpenPreference,
  type LinkOpenPreference,
} from '../../utils/linkOpenPreferences';

interface SessionRow {
  id: string;
  userAgent: string;
  ip: string;
  lastActiveAt: string;
  createdAt: string;
  current: boolean;
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 px-4 py-3 text-neutral-900 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/10';

function shortUserAgent(ua: string): string {
  if (!ua) return '';
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return 'Chrome';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return 'Safari';
  if (/Mobile/i.test(ua)) return 'Mobile browser';
  return ua.length > 48 ? `${ua.slice(0, 48)}…` : ua;
}

const SettingsSecurityPanel: React.FC = () => {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(Boolean(user?.twoFactorEnabled));
  const [twoFaMode, setTwoFaMode] = useState<TwoFactorModalMode | null>(null);
  const [twoFaBusy, setTwoFaBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [secret, setSecret] = useState('');

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [linkOpenPreference, setLinkOpenPreferenceState] =
    useState<LinkOpenPreference>(() => getLinkOpenPreference());

  const applyLinkOpenPreference = (next: LinkOpenPreference) => {
    setLinkOpenPreference(next);
    setLinkOpenPreferenceState(next);
    showToast(t('settings.securityLinkOpenSaved'));
  };

  useEffect(() => {
    setTwoFactorEnabled(Boolean(user?.twoFactorEnabled));
  }, [user?.twoFactorEnabled]);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setSessionsLoading(true);
    try {
      const res = await fetch(`${AUTH_API}/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray((data as { sessions?: SessionRow[] }).sessions)) {
        setSessions((data as { sessions: SessionRow[] }).sessions);
      }
    } catch {
      /* ignore */
    } finally {
      setSessionsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

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

  const startTwoFaSetup = async () => {
    if (!token) return;
    setTwoFaBusy(true);
    setQrUrl('');
    setSecret('');
    try {
      const res = await fetch(`${AUTH_API}/2fa/setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data as { message?: string }).message || t('settings.security2faSetupFailed'), 'error');
        return;
      }
      setQrUrl((data as { qrUrl?: string }).qrUrl || '');
      setSecret((data as { secret?: string }).secret || '');
      setTwoFaMode('setup');
    } catch {
      showToast(t('settings.security2faSetupFailed'), 'error');
    } finally {
      setTwoFaBusy(false);
    }
  };

  const confirmTwoFaEnable = async (code: string) => {
    if (!token || code.trim().length < 6) {
      throw new Error(t('settings.security2faInvalidCode'));
    }
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${AUTH_API}/2fa/enable`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { message?: string }).message || t('settings.security2faInvalidCode'),
        );
      }
      setTwoFactorEnabled(true);
      setTwoFaMode(null);
      setQrUrl('');
      setSecret('');
      showToast(t('settings.security2faEnabledToast'));
    } finally {
      setTwoFaBusy(false);
    }
  };

  const confirmTwoFaDisable = async (payload: { code?: string; password?: string }) => {
    if (!token) return;
    setTwoFaBusy(true);
    try {
      const res = await fetch(`${AUTH_API}/2fa/disable`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: payload.code || undefined,
          password: payload.password || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { message?: string }).message || t('settings.security2faInvalidCode'),
        );
      }
      setTwoFactorEnabled(false);
      setTwoFaMode(null);
      showToast(t('settings.security2faDisabledToast'));
    } finally {
      setTwoFaBusy(false);
    }
  };

  const cancelTwoFaFlow = () => {
    if (twoFaBusy) return;
    setTwoFaMode(null);
    setQrUrl('');
    setSecret('');
  };

  const revokeSession = async (id: string) => {
    if (!token) return;
    setRevokingId(id);
    try {
      const res = await fetch(`${AUTH_API}/sessions/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        showToast(t('settings.securitySessionRevokeFailed'), 'error');
        return;
      }
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showToast(t('settings.securitySessionRevoked'));
    } catch {
      showToast(t('settings.securitySessionRevokeFailed'), 'error');
    } finally {
      setRevokingId(null);
    }
  };

  const formatSessionDate = (value: string) => {
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return value;
    }
  };

  const handleTwoFaToggle = (enable: boolean) => {
    if (twoFaBusy || twoFaMode) return;
    if (enable) void startTwoFaSetup();
    else setTwoFaMode('disable');
  };

  const passwordReady = currentPassword && newPassword && confirmPassword;

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 hidden lg:block">
        <h2 className="text-2xl font-bold text-neutral-900">{t('settings.securityHeading')}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t('settings.securityHint')}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            twoFactorEnabled
              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
              : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {twoFactorEnabled ? t('settings.security2faBadgeOn') : t('settings.security2faBadgeOff')}
        </span>
      </div>

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('settings.securityChangePassword')}
      </h3>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
            <KeyRound className="h-5 w-5 text-neutral-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900">{t('settings.securityPasswordCardTitle')}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{t('settings.securityPasswordCardHint')}</p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              {t('settings.securityCurrentPassword')}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {t('settings.securityNewPassword')}
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
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
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end border-t border-neutral-100 pt-4">
          <button
            type="button"
            disabled={saving || !passwordReady}
            onClick={() => void submitPassword()}
            className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? t('settings.saving') : t('settings.securityUpdatePassword')}
          </button>
        </div>
      </section>

      <h3 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('settings.security2faTitle')}
      </h3>
      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white px-4">
        <SettingsToggleRow
          title={t('settings.security2faTitle')}
          description={t('settings.security2faHint')}
          checked={twoFactorEnabled}
          disabled={twoFaBusy || Boolean(twoFaMode)}
          onChange={handleTwoFaToggle}
        />
      </section>

      <SettingsTwoFactorModal
        open={Boolean(twoFaMode)}
        mode={twoFaMode}
        busy={twoFaBusy}
        qrUrl={qrUrl}
        secret={secret}
        onClose={cancelTwoFaFlow}
        onConfirmEnable={confirmTwoFaEnable}
        onConfirmDisable={confirmTwoFaDisable}
      />

      <h3
        id="settings-link-opening"
        className="mb-2 mt-8 scroll-mt-24 text-sm font-semibold uppercase tracking-wide text-neutral-500"
      >
        {t('settings.securityLinkOpenTitle')}
      </h3>
      <section className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
        <div className="flex items-start gap-3 border-b border-neutral-100 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
            <Globe className="h-5 w-5 text-neutral-600" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-neutral-900">{t('settings.securityLinkOpenCardTitle')}</p>
            <p className="mt-0.5 text-sm text-neutral-500">{t('settings.securityLinkOpenHint')}</p>
          </div>
        </div>
        <fieldset className="mt-3 space-y-1">
          <legend className="sr-only">{t('settings.securityLinkOpenTitle')}</legend>
          {(
            [
              { value: 'ask' as const, labelKey: 'settings.securityLinkOpenAsk', hintKey: 'settings.securityLinkOpenAskHint' },
              { value: 'here' as const, labelKey: 'settings.securityLinkOpenHere', hintKey: 'settings.securityLinkOpenHereHint' },
              {
                value: 'newTab' as const,
                labelKey: 'settings.securityLinkOpenNewTab',
                hintKey: 'settings.securityLinkOpenNewTabHint',
              },
            ] as const
          ).map((opt) => {
            const selected = linkOpenPreference === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-3 transition-colors ${
                  selected ? 'bg-neutral-50' : 'hover:bg-neutral-50/70'
                }`}
              >
                <input
                  type="radio"
                  name="link-open-preference"
                  className="mt-1 h-4 w-4 border-neutral-300 text-black focus:ring-black/20"
                  checked={selected}
                  onChange={() => applyLinkOpenPreference(opt.value)}
                />
                <span className="min-w-0">
                  <span className="block font-medium text-neutral-900">{t(opt.labelKey)}</span>
                  <span className="mt-0.5 block text-sm text-neutral-500">{t(opt.hintKey)}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </section>

      <h3 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('settings.securitySessionsTitle')}
      </h3>
      <section className="rounded-2xl border border-neutral-200 bg-white px-4">
        <p className="border-b border-neutral-100 py-3 text-sm text-neutral-500">
          {t('settings.securitySessionsHint')}
        </p>

        {sessionsLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('settings.securitySessionsLoading')}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex items-center gap-3 py-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
              <Monitor className="h-5 w-5 text-neutral-500" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-neutral-900">{t('settings.securityThisDevice')}</p>
              <p className="text-sm text-neutral-500">{t('settings.securityActiveNow')}</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {sessions.map((s) => {
              const label = shortUserAgent(s.userAgent) || t('settings.securityUnknownDevice');
              return (
                <li key={s.id} className="flex items-start justify-between gap-3 py-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100">
                      <Monitor className="h-5 w-5 text-neutral-500" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-neutral-900">
                        <span className="truncate">{label}</span>
                        {s.current ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200/80">
                            {t('settings.securityThisDevice')}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {s.ip ? `${s.ip} · ` : ''}
                        {t('settings.securityLastActive', { date: formatSessionDate(s.lastActiveAt) })}
                      </p>
                    </div>
                  </div>
                  {!s.current ? (
                    <button
                      type="button"
                      onClick={() => void revokeSession(s.id)}
                      disabled={revokingId === s.id}
                      className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {revokingId === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        t('settings.securityRevokeSession')
                      )}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default SettingsSecurityPanel;
