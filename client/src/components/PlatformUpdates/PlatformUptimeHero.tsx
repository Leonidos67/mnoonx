import React, { Component, type ErrorInfo, type ReactNode, useState } from 'react';
import { Clock } from 'lucide-react';
import Grainient from '../Grainient';
import { PLATFORM_LAUNCH_AT, usePlatformUptime } from '../../hooks/usePlatformUptime';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../i18n/useTranslation';

const HERO_GRAINIENT = {
  color1: '#6366F1',
  color2: '#3B82F6',
  color3: '#ffffff',
  timeSpeed: 0.85,
  colorBalance: 0,
  warpStrength: 1,
  warpFrequency: 5,
  warpSpeed: 2,
  warpAmplitude: 50,
  blendAngle: 0,
  blendSoftness: 0.05,
  rotationAmount: 500,
  noiseScale: 2,
  grainAmount: 0.1,
  grainScale: 2,
  grainAnimated: false,
  contrast: 1.5,
  gamma: 1,
  saturation: 1,
  centerX: 0,
  centerY: 0,
  zoom: 0.9,
} as const;

function canUseWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
  } catch {
    return false;
  }
}

class GrainientErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('PlatformUptimeHero: Grainient failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const HeroGradientFallback: React.FC = () => (
  <div
    className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${HERO_GRAINIENT.color1} 0%, ${HERO_GRAINIENT.color2} 50%, ${HERO_GRAINIENT.color3} 100%)`,
    }}
    aria-hidden
  />
);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

interface UptimeStatProps {
  value: number;
  label: string;
}

const UptimeStat: React.FC<UptimeStatProps> = ({ value, label }) => (
  <div className="flex min-w-[4.5rem] flex-1 flex-col items-center rounded-2xl border border-white/20 bg-white/10 px-3 py-4 backdrop-blur-md sm:min-w-[5.5rem] sm:px-4 sm:py-5">
    <span className="text-3xl font-bold tabular-nums tracking-tight text-white sm:text-4xl">
      {pad2(value)}
    </span>
    <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/75 sm:text-xs">
      {label}
    </span>
  </div>
);

const PlatformUptimeHero: React.FC = () => {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [webglOk] = useState(canUseWebGL2);
  const { days, hours, minutes, seconds } = usePlatformUptime();

  const launchLabel = PLATFORM_LAUNCH_AT.toLocaleString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-[#e7e7e7] shadow-sm">
      <div className="absolute inset-0 z-0">
        <HeroGradientFallback />
        {webglOk ? (
          <GrainientErrorBoundary fallback={null}>
            <Grainient
              {...HERO_GRAINIENT}
              className="absolute inset-0 h-full w-full"
              style={{ width: '100%', height: '100%' }}
            />
          </GrainientErrorBoundary>
        ) : null}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 px-5 py-8 sm:px-10 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {t('platformUpdates.uptime.badge')}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
              {t('platformUpdates.pageTitle')}
            </h1>
            <p className="mt-2 text-sm text-white/85 sm:text-base">{t('platformUpdates.pageSubtitle')}</p>
            <p className="mt-3 text-xs text-white/65 sm:text-sm">
              {t('platformUpdates.uptime.since', { date: launchLabel })}
            </p>
          </div>

          <div
            className="flex w-full gap-2 sm:gap-3 lg:max-w-lg lg:shrink-0"
            role="timer"
            aria-live="polite"
            aria-label={t('platformUpdates.uptime.ariaLive', {
              days,
              hours,
              minutes,
              seconds,
            })}
          >
            <UptimeStat value={days} label={t('platformUpdates.uptime.days')} />
            <UptimeStat value={hours} label={t('platformUpdates.uptime.hours')} />
            <UptimeStat value={minutes} label={t('platformUpdates.uptime.minutes')} />
            <UptimeStat value={seconds} label={t('platformUpdates.uptime.seconds')} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformUptimeHero;
