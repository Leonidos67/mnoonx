/** Platform release notes — newest first. */
export interface PlatformRelease {
  version: string;
  date: string;
  titleKey: string;
  itemKeys: string[];
}

/** User-facing label (v-prefix added in UI). Latest line: 1.2; patch releases: 1.1.N; launch: 1.0.0 */
export function formatPlatformVersionLabel(version: string): string {
  if (version === '1.2.0') return '1.2';
  return version;
}

export const PLATFORM_RELEASES: PlatformRelease[] = [
  {
    version: '1.3.0',
    date: '2026-06-11',
    titleKey: 'platformUpdates.releases.v17.title',
    itemKeys: [
      'platformUpdates.releases.v17.items.heatmap',
      'platformUpdates.releases.v17.items.analytics',
      'platformUpdates.releases.v17.items.chat',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-05-26',
    titleKey: 'platformUpdates.releases.v16.title',
    itemKeys: [
      'platformUpdates.releases.v16.items.docs',
      'platformUpdates.releases.v16.items.support',
      'platformUpdates.releases.v16.items.search',
      'platformUpdates.releases.v16.items.nav',
    ],
  },
  {
    version: '1.1.5',
    date: '2026-05-23',
    titleKey: 'platformUpdates.releases.v15.title',
    itemKeys: [
      'platformUpdates.releases.v15.items.chatUi',
      'platformUpdates.releases.v15.items.stickers',
      'platformUpdates.releases.v15.items.readReceipts',
      'platformUpdates.releases.v15.items.threads',
    ],
  },
  {
    version: '1.1.4',
    date: '2026-05-23',
    titleKey: 'platformUpdates.releases.v14.title',
    itemKeys: [
      'platformUpdates.releases.v14.items.activity',
      'platformUpdates.releases.v14.items.design',
      'platformUpdates.releases.v14.items.mobile',
      'platformUpdates.releases.v14.items.settings',
    ],
  },
  {
    version: '1.1.3',
    date: '2026-05-22',
    titleKey: 'platformUpdates.releases.v13.title',
    itemKeys: [
      'platformUpdates.releases.v13.items.feed',
      'platformUpdates.releases.v13.items.discover',
      'platformUpdates.releases.v13.items.ai',
      'platformUpdates.releases.v13.items.diversity',
    ],
  },
  {
    version: '1.1.2',
    date: '2026-05-22',
    titleKey: 'platformUpdates.releases.v12.title',
    itemKeys: [
      'platformUpdates.releases.v12.items.apps',
      'platformUpdates.releases.v12.items.dashboard',
      'platformUpdates.releases.v12.items.communities',
      'platformUpdates.releases.v12.items.roles',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-05-21',
    titleKey: 'platformUpdates.releases.v11.title',
    itemKeys: [
      'platformUpdates.releases.v11.items.messenger',
      'platformUpdates.releases.v11.items.notifications',
      'platformUpdates.releases.v11.items.dm',
      'platformUpdates.releases.v11.items.system',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-05-21',
    titleKey: 'platformUpdates.releases.v10.title',
    itemKeys: [
      'platformUpdates.releases.v10.items.launch',
      'platformUpdates.releases.v10.items.feed',
      'platformUpdates.releases.v10.items.profiles',
      'platformUpdates.releases.v10.items.communities',
    ],
  },
];

export const PLATFORM_UPDATES_PATH = '/updates';

const PLATFORM_UPDATES_DISMISS_KEY = 'mnoonx-platform-updates-dismissed';

export function getLatestPlatformVersion(): string {
  return PLATFORM_RELEASES[0]?.version ?? '1.0.0';
}

export function readDismissedUpdatesVersion(): string | null {
  try {
    return localStorage.getItem(PLATFORM_UPDATES_DISMISS_KEY);
  } catch {
    return null;
  }
}

export function dismissUpdatesPromo(version: string = getLatestPlatformVersion()): void {
  try {
    localStorage.setItem(PLATFORM_UPDATES_DISMISS_KEY, version);
  } catch {
    /* ignore */
  }
}

/** Show promo until user dismisses the current latest release. */
export function shouldShowUpdatesPromo(): boolean {
  return readDismissedUpdatesVersion() !== getLatestPlatformVersion();
}
