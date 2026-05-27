import React, { Component, type ErrorInfo, type ReactNode, useCallback, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Grainient from '../Grainient';
import {
  PLATFORM_UPDATES_PATH,
  dismissUpdatesPromo,
  getLatestPlatformVersion,
  shouldShowUpdatesPromo,
} from '../../constants/platformUpdates';
import { useTranslation } from '../../i18n/useTranslation';

const PROMO_GRAINIENT_PROPS = {
  color1: '#6366F1',
  color2: '#3B82F6',
  color3: '#000000',
  timeSpeed: 1.2,
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
    console.warn('PlatformUpdatesPromoButton: Grainient failed', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const PromoGradientFallback: React.FC = () => (
  <div
    className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${PROMO_GRAINIENT_PROPS.color1} 0%, ${PROMO_GRAINIENT_PROPS.color2} 55%, ${PROMO_GRAINIENT_PROPS.color3} 100%)`,
    }}
    aria-hidden
  />
);

const PlatformUpdatesPromoButton: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const latestVersion = getLatestPlatformVersion();
  const [webglOk] = useState(canUseWebGL2);
  const [visible, setVisible] = useState(
    () => shouldShowUpdatesPromo() && location.pathname !== PLATFORM_UPDATES_PATH
  );

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dismissUpdatesPromo(latestVersion);
      setVisible(false);
    },
    [latestVersion]
  );

  if (!visible || location.pathname === PLATFORM_UPDATES_PATH) {
    return null;
  }

  const promoLabel = t('platformUpdates.promoButtonAria', { version: `v${latestVersion}` });

  return (
    <div className="relative shrink-0 pr-1 pt-1">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute -right-0.5 -top-0.5 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900/90 text-white shadow-md transition-colors hover:bg-neutral-800"
        aria-label={t('platformUpdates.dismissPromoAria')}
      >
        <X className="h-3 w-3" strokeWidth={2.5} aria-hidden />
      </button>

      <Link
        to={PLATFORM_UPDATES_PATH}
        className="relative inline-flex shrink-0 items-center overflow-hidden rounded-full shadow-sm transition-transform hover:brightness-105 active:scale-[0.95]"
        aria-label={promoLabel}
        title={promoLabel}
      >
        <span className="pointer-events-none absolute inset-0" aria-hidden>
          <PromoGradientFallback />
          {webglOk ? (
            <GrainientErrorBoundary fallback={null}>
              <Grainient
                {...PROMO_GRAINIENT_PROPS}
                className="absolute inset-0 h-full w-full"
                style={{ width: '100%', height: '100%' }}
              />
            </GrainientErrorBoundary>
          ) : null}
        </span>
        <span className="relative z-10 whitespace-nowrap px-4 py-2 text-sm font-semibold text-white drop-shadow-sm">
          {t('platformUpdates.promoButton', { version: `v${latestVersion}` })}
        </span>
      </Link>
    </div>
  );
};

export default PlatformUpdatesPromoButton;
