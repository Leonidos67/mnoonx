import { COMMUNITIES_API } from '../config/api';

export type CommunityAppStatEvent = 'open' | 'view' | 'click';

/** Fire-and-forget engagement tracking for community app instances. */
export function trackCommunityAppStat(
  handle: string,
  instanceId: string,
  event: CommunityAppStatEvent,
  token: string | null | undefined,
): void {
  if (!handle || !instanceId || !token) return;
  void fetch(
    `${COMMUNITIES_API}/${encodeURIComponent(handle)}/apps/instances/${encodeURIComponent(instanceId)}/track`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ event }),
    },
  ).catch(() => {
    /* ignore network errors */
  });
}
