import React, { useEffect, useState } from 'react';
import SettingsToggleRow from './SettingsToggleRow';
import { useTranslation } from '../../i18n/useTranslation';
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
  const [prefs, setPrefs] = useState<NotificationPreferences>(() =>
    loadNotificationPreferences(userId),
  );

  useEffect(() => {
    setPrefs(loadNotificationPreferences(userId));
  }, [userId]);

  const setPref = (key: NotificationPrefKey, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      saveNotificationPreferences(userId, next);
      return next;
    });
  };

  const resetDefaults = () => {
    const next = { ...DEFAULT_NOTIFICATION_PREFS };
    setPrefs(next);
    saveNotificationPreferences(userId, next);
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
