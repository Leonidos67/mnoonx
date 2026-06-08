export function formatUsd(value: number | null | undefined, compact = false): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (compact) {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  }
  if (value >= 1) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function pctClass(value: number | null | undefined): string {
  if (value == null) return 'text-neutral-500';
  if (value > 0) return 'text-emerald-600';
  if (value < 0) return 'text-red-600';
  return 'text-neutral-600';
}

export function formatSupply(
  value: number | null | undefined,
  symbol?: string,
  compact = true
): string {
  if (value == null || Number.isNaN(value)) return '—';
  const sym = symbol ? ` ${symbol.toUpperCase()}` : '';
  if (compact) {
    if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T${sym}`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B${sym}`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M${sym}`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K${sym}`;
  }
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}${sym}`;
}

export function formatDominance(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(2)}%`;
}
