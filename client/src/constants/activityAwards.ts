import type { ActivityLevelId, ActivityRuleId } from './activityPoints';

export const ACTIVITY_AWARD_IDS = [
  'balance100',
  'balance500',
  'streak3',
  'streak7',
  'week50',
  'firstPost',
  'firstCommunity',
  'social5',
  'allMissions',
  'levelActive',
  'levelContributor',
  'levelCreator',
  'levelLegend',
  'challenge3',
] as const;

export type ActivityAwardId = (typeof ACTIVITY_AWARD_IDS)[number];

export type ActivityAwardSection = 'records' | 'achievements';

export interface ActivityAwardDef {
  id: ActivityAwardId;
  section: ActivityAwardSection;
  icon: 'coin' | 'flame' | 'chart' | 'pen' | 'users' | 'heart' | 'trophy' | 'star' | 'torch';
}

export const ACTIVITY_AWARDS: ActivityAwardDef[] = [
  { id: 'balance100', section: 'records', icon: 'coin' },
  { id: 'balance500', section: 'records', icon: 'coin' },
  { id: 'week50', section: 'records', icon: 'chart' },
  { id: 'streak3', section: 'records', icon: 'flame' },
  { id: 'streak7', section: 'records', icon: 'flame' },
  { id: 'firstPost', section: 'achievements', icon: 'pen' },
  { id: 'firstCommunity', section: 'achievements', icon: 'users' },
  { id: 'social5', section: 'achievements', icon: 'heart' },
  { id: 'allMissions', section: 'achievements', icon: 'star' },
  { id: 'levelActive', section: 'achievements', icon: 'trophy' },
  { id: 'levelContributor', section: 'achievements', icon: 'trophy' },
  { id: 'levelCreator', section: 'achievements', icon: 'trophy' },
  { id: 'levelLegend', section: 'achievements', icon: 'torch' },
  { id: 'challenge3', section: 'achievements', icon: 'torch' },
];

export function isActivityAwardUnlocked(
  id: ActivityAwardId,
  ctx: {
    balance: number;
    streak: number;
    weekPoints: number;
    completedRuleIds: Set<ActivityRuleId>;
    levelId: ActivityLevelId;
  }
): boolean {
  const { balance, streak, weekPoints, completedRuleIds, levelId } = ctx;
  const socialRules: ActivityRuleId[] = ['follow', 'follower', 'likeReceived', 'message'];
  const socialCount = socialRules.filter((r) => completedRuleIds.has(r)).length;

  switch (id) {
    case 'balance100':
      return balance >= 100;
    case 'balance500':
      return balance >= 500;
    case 'week50':
      return weekPoints >= 50;
    case 'streak3':
      return streak >= 3;
    case 'streak7':
      return streak >= 7;
    case 'firstPost':
      return completedRuleIds.has('post');
    case 'firstCommunity':
      return completedRuleIds.has('communityJoin');
    case 'social5':
      return socialCount >= 3;
    case 'allMissions':
      return completedRuleIds.size >= 8;
    case 'levelActive':
      return levelId !== 'starter';
    case 'levelContributor':
      return ['contributor', 'creator', 'legend'].includes(levelId);
    case 'levelCreator':
      return ['creator', 'legend'].includes(levelId);
    case 'levelLegend':
      return levelId === 'legend';
    case 'challenge3':
      return completedRuleIds.size >= 3;
    default:
      return false;
  }
}
