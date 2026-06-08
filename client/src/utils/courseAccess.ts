export const DRIP_OPTIONS = [
  { days: 0, key: 'immediate' as const },
  { days: 1, key: 'day1' as const },
  { days: 3, key: 'day3' as const },
  { days: 7, key: 'day7' as const },
  { days: 14, key: 'day14' as const },
  { days: 30, key: 'day30' as const },
];

export interface LessonAccessFields {
  isLocked?: boolean;
  unlockAfterDays?: number;
  isAccessible?: boolean;
  dripLabel?: string;
}

export function dripLabelForDays(days: number, isLocked: boolean, t: (k: string) => string): string {
  if (isLocked) return t('community.coursesPanel.drip.private');
  const opt = DRIP_OPTIONS.find((o) => o.days === days);
  if (!opt || opt.days === 0) return t('community.coursesPanel.drip.immediate');
  return t(`community.coursesPanel.drip.${opt.key}`);
}

export function lessonShowsLocked(lesson: LessonAccessFields, isOwner: boolean): boolean {
  if (isOwner) return false;
  if (lesson.isAccessible === false) return true;
  return Boolean(lesson.isLocked);
}
