import React, { Component, type ErrorInfo, type ReactNode, useState } from 'react';
import Grainient from '../Grainient';
import type { GrainientProps } from '../Grainient/grainientTypes';

export const PLATFORM_GRAINIENT_PROPS: GrainientProps = {
  color1: '#6366F1',
  color2: '#3B82F6',
  color3: '#ffffff',
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
};

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
    console.warn('GrainientBackdrop failed:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const GradientFallback: React.FC = () => (
  <div
    className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${PLATFORM_GRAINIENT_PROPS.color1} 0%, ${PLATFORM_GRAINIENT_PROPS.color2} 55%, ${PLATFORM_GRAINIENT_PROPS.color3} 100%)`,
    }}
    aria-hidden
  />
);

interface GrainientBackdropProps {
  className?: string;
  grainientProps?: GrainientProps;
}

/** Animated gradient background with CSS fallback. */
const GrainientBackdrop: React.FC<GrainientBackdropProps> = ({
  className = 'absolute inset-0',
  grainientProps = PLATFORM_GRAINIENT_PROPS,
}) => {
  const [webglOk] = useState(canUseWebGL2);

  return (
    <div className={className} aria-hidden>
      <GradientFallback />
      {webglOk ? (
        <GrainientErrorBoundary fallback={null}>
          <Grainient
            {...grainientProps}
            className="absolute inset-0 h-full w-full"
            style={{ width: '100%', height: '100%' }}
          />
        </GrainientErrorBoundary>
      ) : null}
    </div>
  );
};

export default GrainientBackdrop;
