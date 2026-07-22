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

export type ActivityRuleCategory = 'content' | 'social' | 'community' | 'daily';

export const ACTIVITY_RULE_CATEGORY: Record<ActivityRuleId, ActivityRuleCategory> = {
  post: 'content',
  comment: 'content',
  likeReceived: 'social',
  repost: 'content',
  follow: 'social',
  follower: 'social',
  message: 'social',
  communityJoin: 'community',
  communityPost: 'community',
  dailyVisit: 'daily',
};

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

export const ACTIVITY_LEVEL_IDS = ['starter', 'active', 'contributor', 'creator', 'legend'] as const;
export type ActivityLevelId = (typeof ACTIVITY_LEVEL_IDS)[number];

export const ACTIVITY_LEVEL_THRESHOLDS: Record<ActivityLevelId, number> = {
  starter: 0,
  active: 50,
  contributor: 200,
  creator: 500,
  legend: 1500,
};

export const ACTIVITY_POINTS_STORAGE_KEY = 'mnoonx-activity-points';
export const ACTIVITY_LOG_STORAGE_KEY = 'mnoonx-activity-log';
export const ACTIVITY_DAILY_VISIT_KEY = 'mnoonx-activity-daily-visit';
export const ACTIVITY_STREAK_KEY = 'mnoonx-activity-streak';
export const ACTIVITY_CLAIMED_RULES_KEY = 'mnoonx-activity-claimed-rules';

export interface ActivityLogEntry {
  id: string;
  ruleId: ActivityRuleId;
  points: number;
  createdAt: string;
}

const MAX_LOG_ENTRIES = 80;

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

/** Spend coins in the activity store. */
export function spendActivityPoints(cost: number): { ok: boolean; balance: number } {
  const balance = loadActivityPointsBalance();
  const amount = Math.max(0, Math.floor(cost));
  if (amount > balance) return { ok: false, balance };
  const next = balance - amount;
  saveActivityPointsBalance(next);
  return { ok: true, balance: next };
}

export function loadActivityLog(): ActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityLogEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) =>
        e &&
        typeof e.id === 'string' &&
        ACTIVITY_RULE_IDS.includes(e.ruleId as ActivityRuleId) &&
        typeof e.points === 'number' &&
        typeof e.createdAt === 'string'
    );
  } catch {
    return [];
  }
}

function saveActivityLog(entries: ActivityLogEntry[]): void {
  try {
    localStorage.setItem(
      ACTIVITY_LOG_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES))
    );
  } catch {
    /* ignore */
  }
}

export interface ActivityStateSnapshot {
  balance: number;
  log: ActivityLogEntry[];
  claimedRuleIds: ActivityRuleId[];
  streak: number;
  lastDailyVisit: string;
}

/** Current local activity state, shaped for the `PUT /users/me/activity` sync endpoint. */
export function getActivityStateSnapshot(): ActivityStateSnapshot {
  return {
    balance: loadActivityPointsBalance(),
    log: loadActivityLog(),
    claimedRuleIds: Array.from(loadClaimedRuleIds()),
    streak: getVisitStreak(),
    lastDailyVisit: loadStreakState().lastDate,
  };
}

export interface ActivityStateServerPayload {
  balance?: number;
  log?: ActivityLogEntry[];
  claimedRuleIds?: string[];
  streak?: number;
  lastDailyVisit?: string;
}

/** Overwrites local activity storage with a server snapshot (used on login/sync). */
export function hydrateActivityState(state: ActivityStateServerPayload): void {
  if (typeof state.balance === 'number') {
    saveActivityPointsBalance(state.balance);
  }
  if (Array.isArray(state.log)) {
    saveActivityLog(
      state.log.filter(
        (e): e is ActivityLogEntry =>
          Boolean(e) &&
          typeof e.id === 'string' &&
          ACTIVITY_RULE_IDS.includes(e.ruleId as ActivityRuleId) &&
          typeof e.points === 'number' &&
          typeof e.createdAt === 'string'
      )
    );
  }
  if (Array.isArray(state.claimedRuleIds)) {
    saveClaimedRuleIds(
      new Set(state.claimedRuleIds.filter((id): id is ActivityRuleId =>
        (ACTIVITY_RULE_IDS as readonly string[]).includes(id)
      ))
    );
  }
  if (typeof state.streak === 'number' || typeof state.lastDailyVisit === 'string') {
    const current = loadStreakState();
    saveStreakState({
      count: typeof state.streak === 'number' ? state.streak : current.count,
      lastDate:
        typeof state.lastDailyVisit === 'string' ? state.lastDailyVisit : current.lastDate,
    });
  }
}

export function getActivityLevel(points: number): {
  id: ActivityLevelId;
  next: ActivityLevelId | null;
  progress: number;
  pointsToNext: number;
} {
  let current: ActivityLevelId = 'starter';
  for (const id of ACTIVITY_LEVEL_IDS) {
    if (points >= ACTIVITY_LEVEL_THRESHOLDS[id]) current = id;
  }
  const idx = ACTIVITY_LEVEL_IDS.indexOf(current);
  const next = idx < ACTIVITY_LEVEL_IDS.length - 1 ? ACTIVITY_LEVEL_IDS[idx + 1] : null;
  if (!next) {
    return { id: current, next: null, progress: 100, pointsToNext: 0 };
  }
  const floor = ACTIVITY_LEVEL_THRESHOLDS[current];
  const ceiling = ACTIVITY_LEVEL_THRESHOLDS[next];
  const span = ceiling - floor;
  const progress = span > 0 ? Math.min(100, Math.round(((points - floor) / span) * 100)) : 100;
  return { id: current, next, progress, pointsToNext: Math.max(0, ceiling - points) };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface AwardResult {
  awarded: boolean;
  points: number;
  balance: number;
}

/** Client-side points award (until API exists). dailyVisit deduped per calendar day. */
export function awardActivityPoints(ruleId: ActivityRuleId): AwardResult {
  const points = ACTIVITY_POINTS[ruleId];
  const balance = loadActivityPointsBalance();

  if (ruleId === 'dailyVisit') {
    try {
      if (localStorage.getItem(ACTIVITY_DAILY_VISIT_KEY) === todayKey()) {
        return { awarded: false, points: 0, balance };
      }
      localStorage.setItem(ACTIVITY_DAILY_VISIT_KEY, todayKey());
      bumpVisitStreak();
    } catch {
      return { awarded: false, points: 0, balance };
    }
  }

  const nextBalance = balance + points;
  saveActivityPointsBalance(nextBalance);

  const entry: ActivityLogEntry = {
    id: `${Date.now()}-${ruleId}`,
    ruleId,
    points,
    createdAt: new Date().toISOString(),
  };
  const log = loadActivityLog();
  saveActivityLog([entry, ...log]);

  return { awarded: true, points, balance: nextBalance };
}

export function getWeekPointsEarned(log: ActivityLogEntry[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return log
    .filter((e) => new Date(e.createdAt).getTime() >= weekAgo)
    .reduce((sum, e) => sum + e.points, 0);
}

export function getActionCountThisWeek(log: ActivityLogEntry[]): number {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return log.filter((e) => new Date(e.createdAt).getTime() >= weekAgo).length;
}

export function getCompletedRuleIds(log: ActivityLogEntry[]): Set<ActivityRuleId> {
  return new Set(log.map((e) => e.ruleId));
}

export function loadClaimedRuleIds(): Set<ActivityRuleId> {
  try {
    const raw = localStorage.getItem(ACTIVITY_CLAIMED_RULES_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set();
    const ids = parsed.filter((id): id is ActivityRuleId =>
      (ACTIVITY_RULE_IDS as readonly string[]).includes(id)
    );
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveClaimedRuleIds(ids: Set<ActivityRuleId>): void {
  try {
    localStorage.setItem(ACTIVITY_CLAIMED_RULES_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    /* ignore */
  }
}

/** Rules completed in log but not yet "collected" in the bank UI. */
export function getUnclaimedRuleIds(
  completed: Set<ActivityRuleId>,
  claimed: Set<ActivityRuleId>
): ActivityRuleId[] {
  return ACTIVITY_RULE_IDS.filter((id) => completed.has(id) && !claimed.has(id));
}

export function claimActivityRules(ruleIds: ActivityRuleId[]): Set<ActivityRuleId> {
  const claimed = loadClaimedRuleIds();
  ruleIds.forEach((id) => claimed.add(id));
  saveClaimedRuleIds(claimed);
  return claimed;
}

interface StreakState {
  count: number;
  lastDate: string;
}

function loadStreakState(): StreakState {
  try {
    const raw = localStorage.getItem(ACTIVITY_STREAK_KEY);
    if (!raw) return { count: 0, lastDate: '' };
    const parsed = JSON.parse(raw) as StreakState;
    return {
      count: typeof parsed.count === 'number' ? parsed.count : 0,
      lastDate: typeof parsed.lastDate === 'string' ? parsed.lastDate : '',
    };
  } catch {
    return { count: 0, lastDate: '' };
  }
}

function saveStreakState(state: StreakState): void {
  try {
    localStorage.setItem(ACTIVITY_STREAK_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function bumpVisitStreak(): void {
  const today = todayKey();
  const state = loadStreakState();
  if (state.lastDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const nextCount = state.lastDate === yesterdayKey ? state.count + 1 : 1;
  saveStreakState({ count: nextCount, lastDate: today });
}

/** Current daily visit streak (days in a row). */
export function getVisitStreak(): number {
  const state = loadStreakState();
  const today = todayKey();
  if (state.lastDate === today) return Math.max(1, state.count);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (state.lastDate === yesterday.toISOString().slice(0, 10)) return state.count;

  return 0;
}

export const ACTIVITY_LEVEL_STYLES: Record<
  ActivityLevelId,
  { gradient: string; ring: string; badge: string }
> = {
  starter: {
    gradient: 'from-slate-400 to-slate-500',
    ring: 'ring-slate-300/50',
    badge: 'bg-slate-500/90',
  },
  active: {
    gradient: 'from-[#5181b8] to-[#4a76a8]',
    ring: 'ring-blue-300/60',
    badge: 'bg-[#5181b8]',
  },
  contributor: {
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-300/50',
    badge: 'bg-emerald-500',
  },
  creator: {
    gradient: 'from-violet-500 to-purple-600',
    ring: 'ring-violet-300/50',
    badge: 'bg-violet-600',
  },
  legend: {
    gradient: 'from-amber-400 via-yellow-400 to-orange-500',
    ring: 'ring-amber-300/60',
    badge: 'bg-gradient-to-r from-amber-500 to-orange-500',
  },
};
