/** Activity rule ids — labels live in i18n `activity.rules.*` */
export const ACTIVITY_RULE_IDS = [
  'post',
  'comment',
  'likeReceived',
  'repost',
  'follow',
  'follower',
  'message',
  'communityJoin',
  'communityPost',
  'dailyVisit',
] as const;

export type ActivityRuleId = (typeof ACTIVITY_RULE_IDS)[number];

export const ACTIVITY_POINTS: Record<ActivityRuleId, number> = {
  post: 15,
  comment: 8,
  likeReceived: 3,
  repost: 5,
  follow: 5,
  follower: 10,
  message: 2,
  communityJoin: 20,
  communityPost: 12,
  dailyVisit: 5,
};

export const ACTIVITY_POINTS_STORAGE_KEY = 'mnoonx-activity-points';

export function loadActivityPointsBalance(): number {
  try {
    const raw = localStorage.getItem(ACTIVITY_POINTS_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveActivityPointsBalance(points: number): void {
  try {
    localStorage.setItem(ACTIVITY_POINTS_STORAGE_KEY, String(Math.max(0, Math.floor(points))));
  } catch {
    /* ignore */
  }
}
