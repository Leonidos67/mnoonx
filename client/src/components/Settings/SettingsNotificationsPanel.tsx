import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import SettingsToggleRow from './SettingsToggleRow';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../i18n/useTranslation';
import { USERS_API } from '../../config/api';
import { subscribeToPush, unsubscribeFromPush, sendTestPush, type PushSubscribeErrorCode } from '../../utils/webPush';
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPrefKey,
  type NotificationPreferences,
} from '../../utils/notificationPreferences';

type SettingsNotificationsPanelProps = {
  userId: string | null | undefined;
};

const GENERAL_KEYS: NotificationPrefKey[] = ['popupNotifications', 'soundEffects'];

const ACTIVITY_KEYS: NotificationPrefKey[] = [
  'aiChatMessage',
  'aiChatQuestion',
  'bountyClaimed',
  'newFollower',
  'paymentFailed',
  'upcomingPaymentReminders',
  'withdrawalStatusChange',
  'transferReceived',
  'waitlistAccepted',
];

const SettingsNotificationsPanel: React.FC<SettingsNotificationsPanelProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    loadNotificationPreferences(userId),
  );
  const [loading, setLoading] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const loadedForToken = useRef<string | null>(null);

  useEffect(() => {
    setPrefs(loadNotificationPreferences(userId));
  }, [userId]);

  useEffect(() => {
    if (!token || loadedForToken.current === token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${USERS_API}/me/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as Partial<NotificationPreferences>;
        if (cancelled) return;
        const next = { ...DEFAULT_NOTIFICATION_PREFS, ...data };
        setPrefs(next);
        saveNotificationPreferences(userId, next);
        loadedForToken.current = token;
      } catch {
        /* fall back to local prefs already loaded */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  const persistPref = async (key: NotificationPrefKey, value: boolean) => {
    if (!token) return;
    try {
      const res = await fetch(`${USERS_API}/me/preferences`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) {
        showToast(t('settings.notificationsSaveFailed'), 'error');
      }
    } catch {
      showToast(t('settings.notificationsSaveFailed'), 'error');
    }
  };

  const setPref = (key: NotificationPrefKey, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveNotificationPreferences(userId, next);
      return next;
    });
    void persistPref(key, value);
  };

  const resetDefaults = () => {
    const next = { ...DEFAULT_NOTIFICATION_PREFS };
    setPrefs(next);
    saveNotificationPreferences(userId, next);
    if (token) {
      void fetch(`${USERS_API}/me/preferences`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(next),
      }).catch(() => {});
    }
  };

  const pushErrorMessage = (code: PushSubscribeErrorCode) => {
    const key = `settings.notificationsPushError.${code}`;
    const translated = t(key);
    return translated !== key ? translated : t('settings.notificationsPushEnableFailed');
  };

  const togglePush = async (enable: boolean) => {
    if (!token) {
      showToast(t('settings.notificationsPushSignInRequired'), 'error');
      return;
    }
    setPushBusy(true);
    try {
      if (enable) {
        const result = await subscribeToPush(token);
        if (!result.ok) {
          showToast(pushErrorMessage(result.code), 'error');
          return;
        }
        setPref('pushEnabled', true);
        showToast(t('settings.notificationsPushEnabled'));
      } else {
        await unsubscribeFromPush(token);
        setPref('pushEnabled', false);
        showToast(t('settings.notificationsPushDisabled'));
      }
    } catch {
      showToast(t('settings.notificationsPushEnableFailed'), 'error');
    } finally {
      setPushBusy(false);
    }
  };

  const handleTestPush = async () => {
    if (!token) return;
    setTestBusy(true);
    try {
      const ok = await sendTestPush(token);
      showToast(
        ok ? t('settings.notificationsPushTestSent') : t('settings.notificationsPushTestFailed'),
        ok ? 'success' : 'error',
      );
    } catch {
      showToast(t('settings.notificationsPushTestFailed'), 'error');
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 hidden items-start justify-between gap-4 lg:flex">
        <div>
          <h2 className="text-2xl font-bold">{t('settings.notificationsHeading')}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t('settings.notificationsHint')}</p>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          {t('settings.notificationsReset')}
        </button>
      </div>

      {loading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-neutral-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('settings.notificationsSyncing')}
        </div>
      )}

      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('settings.notificationsPushHeading')}
      </h3>
      <section className="rounded-2xl border border-neutral-200 bg-white px-4 divide-y divide-neutral-100">
        <div className="flex items-start justify-between gap-4 py-4">
          <div>
            <p className="font-medium text-neutral-900">{t('settings.notificationsPushTitle')}</p>
            <p className="mt-1 text-sm text-neutral-500">{t('settings.notificationsPushDescription')}</p>
          </div>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center pt-0.5">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={prefs.pushEnabled}
              disabled={pushBusy}
              onChange={(e) => void togglePush(e.target.checked)}
            />
            <div className="peer h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all peer-checked:bg-black peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-black/10 peer-disabled:opacity-50" />
          </label>
        </div>
        {prefs.pushEnabled && (
          <div className="flex items-center justify-between gap-4 py-4">
            <p className="text-sm text-neutral-500">{t('settings.notificationsPushTestHint')}</p>
            <button
              type="button"
              onClick={() => void handleTestPush()}
              disabled={testBusy}
              className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
            >
              {testBusy ? t('settings.notificationsPushTesting') : t('settings.notificationsPushTest')}
            </button>
          </div>
        )}
      </section>
      <p className="mt-2 text-xs leading-relaxed text-neutral-500">
        {t('settings.notificationsPushRequirements')}
      </p>

      <h3 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('settings.notificationsHeading')}
      </h3>
      <section className="rounded-2xl border border-neutral-200 bg-white px-4 divide-y divide-neutral-100">
        {GENERAL_KEYS.map((key) => (
          <SettingsToggleRow
            key={key}
            title={t(`settings.notif.${key}.title`)}
            description={t(`settings.notif.${key}.description`)}
            checked={prefs[key]}
            onChange={(v) => setPref(key, v)}
          />
        ))}
      </section>

      <h3 className="mb-2 mt-8 text-sm font-semibold uppercase tracking-wide text-neutral-500">
        {t('settings.notificationsActivity')}
      </h3>
      <section className="rounded-2xl border border-neutral-200 bg-white px-4 divide-y divide-neutral-100">
        {ACTIVITY_KEYS.map((key) => (
          <SettingsToggleRow
            key={key}
            title={t(`settings.notif.${key}.title`)}
            description={t(`settings.notif.${key}.description`)}
            checked={prefs[key]}
            onChange={(v) => setPref(key, v)}
          />
        ))}
      </section>
    </div>
  );
};

export default SettingsNotificationsPanel;
