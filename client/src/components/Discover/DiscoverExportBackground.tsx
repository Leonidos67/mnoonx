import React, { Component, type ErrorInfo, type ReactNode, useState } from 'react';
import { Link } from 'react-router-dom';
import Grainient from '../Grainient';
import { useTranslation } from '../../i18n/useTranslation';

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
    console.warn('Grainient failed to render:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const GRAINIENT_PROPS = {
  color1: '#3B82F6',
  color2: '#5227FF',
  color3: '#B497CF',
  timeSpeed: 0.25,
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

const StaticFallback: React.FC = () => (
  <div
    className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${GRAINIENT_PROPS.color1} 0%, ${GRAINIENT_PROPS.color2} 45%, ${GRAINIENT_PROPS.color3} 100%)`,
    }}
    aria-hidden
  />
);

const DiscoverExportBackground: React.FC = () => {
  const { t } = useTranslation();
  const [webglOk] = useState(canUseWebGL2);

  return (
    <section className="w-full">
      <div className="relative isolate h-[260px] w-full overflow-hidden rounded-3xl border border-gray-200 shadow-sm">
        {/* Background: gradient only */}
        <div className="absolute inset-0 z-0">
          <StaticFallback />
          {webglOk ? (
            <GrainientErrorBoundary fallback={null}>
              <Grainient
                {...GRAINIENT_PROPS}
                className="absolute inset-0 h-full w-full"
                style={{ width: '100%', height: '100%' }}
              />
            </GrainientErrorBoundary>
          ) : null}
        </div>

        {/* Readability scrim */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-black/55 via-black/30 to-transparent"
          aria-hidden
        />

        {/* Copy + CTA on top of gradient */}
        <div className="absolute inset-0 z-10 flex flex-col items-start justify-center gap-4 px-8">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-3xl lg:text-4xl">
              {t('discover.exportHero.title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)] sm:text-base">
              {t('discover.exportHero.description')}
            </p>
          </div>
          <Link
            to="/new"
            className="relative z-10 inline-flex shrink-0 items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-colors hover:bg-white/95 sm:text-base"
          >
            {t('discover.exportHero.cta')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default DiscoverExportBackground;
