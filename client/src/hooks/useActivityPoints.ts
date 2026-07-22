import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  awardActivityPoints,
  claimActivityRules,
  getActionCountThisWeek,
  getActivityLevel,
  getActivityStateSnapshot,
  getCompletedRuleIds,
  getUnclaimedRuleIds,
  getVisitStreak,
  getWeekPointsEarned,
  hydrateActivityState,
  loadActivityLog,
  loadActivityPointsBalance,
  loadClaimedRuleIds,
  type ActivityLogEntry,
  type ActivityRuleId,
} from '../constants/activityPoints';
import { USERS_API } from '../config/api';

let serverSyncedThisSession = false;

export function useActivityPoints() {
  const [balance, setBalance] = useState(() => loadActivityPointsBalance());
  const [log, setLog] = useState<ActivityLogEntry[]>(() => loadActivityLog());
  const [claimedRuleIds, setClaimedRuleIds] = useState(() => loadClaimedRuleIds());
  const pushTimer = useRef<number | null>(null);

  const pushToServer = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    const snapshot = getActivityStateSnapshot();
    void fetch(`${USERS_API}/me/activity`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot),
    }).catch(() => {});
  }, []);

  const schedulePush = useCallback(() => {
    if (pushTimer.current) window.clearTimeout(pushTimer.current);
    pushTimer.current = window.setTimeout(() => {
      pushTimer.current = null;
      pushToServer();
    }, 1200);
  }, [pushToServer]);

  const refresh = useCallback(() => {
    setBalance(loadActivityPointsBalance());
    setLog(loadActivityLog());
    setClaimedRuleIds(loadClaimedRuleIds());
    schedulePush();
  }, [schedulePush]);

  const claimRules = useCallback(
    (ruleIds: ActivityRuleId[]) => {
      if (ruleIds.length === 0) return;
      setClaimedRuleIds(claimActivityRules(ruleIds));
      schedulePush();
    },
    [schedulePush]
  );

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token || serverSyncedThisSession) return;
    serverSyncedThisSession = true;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${USERS_API}/me/activity`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          balance?: number;
          log?: ActivityLogEntry[];
          claimedRuleIds?: string[];
          streak?: number;
          lastDailyVisit?: string;
        };
        const hasServerData = (data.log && data.log.length > 0) || (data.balance ?? 0) > 0;
        if (hasServerData) {
          hydrateActivityState(data);
          refresh();
        } else {
          // Fresh server record — push whatever exists locally so it isn't lost.
          pushToServer();
        }
      } catch {
        /* offline — keep local state */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh, pushToServer]);

  useEffect(() => {
    const result = awardActivityPoints('dailyVisit');
    if (result.awarded) {
      setBalance(result.balance);
      setLog(loadActivityLog());
      schedulePush();
    }
  }, [schedulePush]);

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
