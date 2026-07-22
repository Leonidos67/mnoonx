export type NotificationPrefKey =
  | 'popupNotifications'
  | 'soundEffects'
  | 'aiChatMessage'
  | 'aiChatQuestion'
  | 'bountyClaimed'
  | 'newFollower'
  | 'paymentFailed'
  | 'upcomingPaymentReminders'
  | 'withdrawalStatusChange'
  | 'transferReceived'
  | 'waitlistAccepted'
  | 'pushEnabled';

export type NotificationPreferences = Record<NotificationPrefKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  popupNotifications: true,
  soundEffects: true,
  aiChatMessage: true,
  aiChatQuestion: true,
  bountyClaimed: true,
  newFollower: true,
  paymentFailed: true,
  upcomingPaymentReminders: true,
  withdrawalStatusChange: true,
  transferReceived: true,
  waitlistAccepted: true,
  pushEnabled: false,
};

const storageKey = (userId: string) => `mnoonx:notificationPrefs:${userId}`;

export function loadNotificationPreferences(userId: string | null | undefined): NotificationPreferences {
  if (!userId || typeof window === 'undefined') return { ...DEFAULT_NOTIFICATION_PREFS };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

export function saveNotificationPreferences(
  userId: string | null | undefined,
  prefs: NotificationPreferences,
) {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(prefs));
  } catch {
    /* ignore quota */
  }
}
