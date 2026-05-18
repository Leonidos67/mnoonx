import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Loader2, Radio } from 'lucide-react';
import type { PulseResponse, PulseSentiment } from '../../types/ai';

const API_AI = 'http://localhost:5000/api/ai';

const PULSE_INTERVAL_MS = 90_000;

const sentimentStyles: Record<
  PulseSentiment,
  { ring: string; dot: string; label: string; bg: string }
> = {
  bullish: {
    ring: 'ring-emerald-500/40',
    dot: 'bg-emerald-400',
    label: 'text-emerald-400',
    bg: 'from-emerald-950/80 to-[#0d1117]',
  },
  neutral: {
    ring: 'ring-amber-500/40',
    dot: 'bg-amber-400',
    label: 'text-amber-400',
    bg: 'from-amber-950/50 to-[#0d1117]',
  },
  bearish: {
    ring: 'ring-red-500/40',
    dot: 'bg-red-400',
    label: 'text-red-400',
    bg: 'from-red-950/60 to-[#0d1117]',
  },
};

const sentimentLabel: Record<PulseSentiment, string> = {
  bullish: 'Bullish pulse',
  neutral: 'Neutral pulse',
  bearish: 'Caution pulse',
};

interface AlphaPulseProps {
  variant?: 'dark' | 'light';
}

const AlphaPulse: React.FC<AlphaPulseProps> = ({ variant = 'dark' }) => {
  const [pulse, setPulse] = useState<PulseResponse | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const fetchPulse = useCallback(async () => {
    if (hasLoaded.current) setRefreshing(true);
    try {
      const res = await fetch(`${API_AI}/pulse`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message || 'Pulse unavailable');
      }
      const data = (await res.json()) as PulseResponse;
      setPulse(data);
      setError(null);
      hasLoaded.current = true;
    } catch (e) {
      if (!hasLoaded.current) {
        setError(e instanceof Error ? e.message : 'Pulse unavailable');
      }
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchPulse();

    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      void fetchPulse();
    };

    const id = window.setInterval(tick, PULSE_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void fetchPulse();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchPulse]);

  const sentiment: PulseSentiment = pulse?.sentiment ?? 'neutral';
  const styles = sentimentStyles[sentiment];
  const isLight = variant === 'light';
  const lightLabelClass =
    sentiment === 'bullish'
      ? 'text-emerald-600'
      : sentiment === 'bearish'
        ? 'text-red-600'
        : 'text-amber-600';

  return (
    <aside
      className={
        isLight
          ? 'flex min-h-[220px] flex-col rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm'
          : `flex h-full min-h-[220px] flex-col rounded-2xl bg-gradient-to-b ${styles.bg} p-5 ring-1 ${styles.ring}`
      }
    >
      <header className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              isLight ? 'bg-violet-50' : 'bg-white/5'
            }`}
          >
            <Radio className={`h-4 w-4 ${isLight ? 'text-violet-600' : 'text-violet-400'}`} />
          </span>
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wider ${
                isLight ? 'text-violet-700' : 'text-violet-300/90'
              }`}
            >
              AI Alpha Pulse
            </p>
            <p className={`text-sm font-medium ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Live AI thought
            </p>
          </div>
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isLight ? lightLabelClass : styles.label
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full animate-pulse ${
              isLight
                ? sentiment === 'bullish'
                  ? 'bg-emerald-500'
                  : sentiment === 'bearish'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                : styles.dot
            }`}
          />
          {sentimentLabel[sentiment]}
        </span>
      </header>

      <section className="flex flex-1 flex-col justify-center">
        {initialLoading && !pulse && (
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing pulse…
          </div>
        )}

        {error && !pulse && (
          <p className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400/90'}`}>{error}</p>
        )}

        {pulse && (
          <p
            className={`text-[15px] leading-relaxed ${
              isLight ? 'text-neutral-800' : 'text-neutral-100'
            }`}
          >
            {pulse.text}
          </p>
        )}

        {refreshing && pulse && (
          <p
            className={`mt-3 flex items-center gap-1.5 text-xs ${
              isLight ? 'text-neutral-400' : 'text-neutral-600'
            }`}
          >
            <Activity className="h-3 w-3" />
            Updating…
          </p>
        )}
      </section>

      <p className={`mt-4 text-[11px] leading-snug ${isLight ? 'text-neutral-400' : 'text-neutral-600'}`}>
        Refreshes every ~90s. Opinion only — not financial advice.
      </p>
    </aside>
  );
};

export default AlphaPulse;
