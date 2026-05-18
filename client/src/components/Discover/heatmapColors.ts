/** Background classes for 24h % change (heatmap tiles). */
export function heatmapChangeBg(change: number | null | undefined): string {
  if (change == null || Number.isNaN(change)) return 'bg-neutral-500';
  if (change >= 10) return 'bg-emerald-700';
  if (change >= 5) return 'bg-emerald-600';
  if (change >= 2) return 'bg-emerald-500';
  if (change > 0) return 'bg-emerald-400';
  if (change === 0) return 'bg-neutral-500';
  if (change > -2) return 'bg-red-400';
  if (change > -5) return 'bg-red-500';
  if (change > -10) return 'bg-red-600';
  return 'bg-red-700';
}

export function heatmapTextOnBg(change: number | null | undefined): string {
  if (change == null) return 'text-white';
  return Math.abs(change) >= 2 || change <= -2 ? 'text-white' : 'text-white/95';
}
