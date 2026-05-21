import { awardActivityPoints, type ActivityRuleId, type AwardResult } from '../constants/activityPoints';

/** Call after a successful user action to grant points (client-side until API exists). */
export function tryAwardActivity(ruleId: ActivityRuleId): AwardResult {
  return awardActivityPoints(ruleId);
}
