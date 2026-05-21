import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  awardActivityPoints,
  claimActivityRules,
  getActionCountThisWeek,
  getActivityLevel,
  getCompletedRuleIds,
  getUnclaimedRuleIds,
  getVisitStreak,
  getWeekPointsEarned,
  loadActivityLog,
  loadActivityPointsBalance,
  loadClaimedRuleIds,
  type ActivityLogEntry,
  type ActivityRuleId,
} from '../constants/activityPoints';

export function useActivityPoints() {
  const [balance, setBalance] = useState(() => loadActivityPointsBalance());
  const [log, setLog] = useState<ActivityLogEntry[]>(() => loadActivityLog());
  const [claimedRuleIds, setClaimedRuleIds] = useState(() => loadClaimedRuleIds());

  const refresh = useCallback(() => {
    setBalance(loadActivityPointsBalance());
    setLog(loadActivityLog());
    setClaimedRuleIds(loadClaimedRuleIds());
  }, []);

  const claimRules = useCallback((ruleIds: ActivityRuleId[]) => {
    if (ruleIds.length === 0) return;
    setClaimedRuleIds(claimActivityRules(ruleIds));
  }, []);

  useEffect(() => {
    const result = awardActivityPoints('dailyVisit');
    if (result.awarded) {
      setBalance(result.balance);
      setLog(loadActivityLog());
    }
  }, []);

  const level = useMemo(() => getActivityLevel(balance), [balance]);
  const weekPoints = useMemo(() => getWeekPointsEarned(log), [log]);
  const weekActions = useMemo(() => getActionCountThisWeek(log), [log]);
  const completedRuleIds = useMemo(() => getCompletedRuleIds(log), [log]);
  const streak = useMemo(() => getVisitStreak(), [log, balance]);
  const unclaimedRuleIds = useMemo(
    () => getUnclaimedRuleIds(completedRuleIds, claimedRuleIds),
    [completedRuleIds, claimedRuleIds]
  );

  return {
    balance,
    log,
    refresh,
    level,
    weekPoints,
    weekActions,
    completedRuleIds,
    claimedRuleIds,
    unclaimedRuleIds,
    claimRules,
    streak,
  };
}
