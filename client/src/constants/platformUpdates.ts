/** Platform release notes — newest first. */
export interface PlatformRelease {
  version: string;
  date: string;
  titleKey: string;
  itemKeys: string[];
}

export const PLATFORM_RELEASES: PlatformRelease[] = [
  {
    version: '1.6',
    date: '2026-05-22',
    titleKey: 'platformUpdates.releases.v16.title',
    itemKeys: [
      'platformUpdates.releases.v16.items.docs',
      'platformUpdates.releases.v16.items.support',
      'platformUpdates.releases.v16.items.search',
    ],
  },
  {
    version: '1.5',
    date: '2026-05-14',
    titleKey: 'platformUpdates.releases.v15.title',
    itemKeys: [
      'platformUpdates.releases.v15.items.chatUi',
      'platformUpdates.releases.v15.items.stickers',
      'platformUpdates.releases.v15.items.readReceipts',
    ],
  },
  {
    version: '1.4',
    date: '2026-05-06',
    titleKey: 'platformUpdates.releases.v14.title',
    itemKeys: [
      'platformUpdates.releases.v14.items.activity',
      'platformUpdates.releases.v14.items.design',
      'platformUpdates.releases.v14.items.mobile',
    ],
  },
  {
    version: '1.3',
    date: '2026-04-22',
    titleKey: 'platformUpdates.releases.v13.title',
    itemKeys: [
      'platformUpdates.releases.v13.items.feed',
      'platformUpdates.releases.v13.items.discover',
      'platformUpdates.releases.v13.items.ai',
    ],
  },
  {
    version: '1.2',
    date: '2026-04-05',
    titleKey: 'platformUpdates.releases.v12.title',
    itemKeys: [
      'platformUpdates.releases.v12.items.apps',
      'platformUpdates.releases.v12.items.dashboard',
      'platformUpdates.releases.v12.items.communities',
    ],
  },
  {
    version: '1.1',
    date: '2026-03-18',
    titleKey: 'platformUpdates.releases.v11.title',
    itemKeys: [
      'platformUpdates.releases.v11.items.messenger',
      'platformUpdates.releases.v11.items.notifications',
      'platformUpdates.releases.v11.items.dm',
    ],
  },
  {
    version: '1.0',
    date: '2026-03-01',
    titleKey: 'platformUpdates.releases.v10.title',
    itemKeys: [
      'platformUpdates.releases.v10.items.launch',
      'platformUpdates.releases.v10.items.feed',
      'platformUpdates.releases.v10.items.profiles',
    ],
  },
];

export const PLATFORM_UPDATES_PATH = '/updates';

const PLATFORM_UPDATES_DISMISS_KEY = 'mnoonx-platform-updates-dismissed';

export function getLatestPlatformVersion(): string {
  return PLATFORM_RELEASES[0]?.version ?? '1.0';
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
