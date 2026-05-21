import type { ActivityRuleId } from '../../constants/activityPoints';

export function formatRelativeTime(iso: string, locale: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale.startsWith('ru') ? 'только что' : 'just now';
  if (mins < 60) return locale.startsWith('ru') ? `${mins} мин назад` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return locale.startsWith('ru') ? `${hours} ч назад` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale.startsWith('ru') ? `${days} дн назад` : `${days}d ago`;
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export function countRuleCompletions(log: { ruleId: ActivityRuleId }[], ruleId: ActivityRuleId): number {
  return log.filter((e) => e.ruleId === ruleId).length;
}
