import React, {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PixelBlast from '../PixelBlast';

const AUTO_MS = 20000;
const TRANSITION = { duration: 0.42, ease: [0.32, 0.72, 0, 1] as const };

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 28 : -28,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -28 : 28,
  }),
};

function canUseWebGL2(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
  } catch {
    return false;
  }
}

class PixelBlastErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('PixelBlast failed to render:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

type PromoSlide = {
  id: string;
  label: string;
  accent: string;
  title: string;
  description: string;
  cta: string;
  to: string;
};

const SLIDES: PromoSlide[] = [
  {
    id: 'market',
    label: 'Market',
    accent: '#3B82F6',
    title: 'Heatmap • AI Alpha • Live Analytics',
    description:
      'Follow the market in real time, see where it is "burning" and immediately ask the AI.',
    cta: 'Go to Market',
    to: '/discover?tab=market',
  },
  {
    id: 'discover',
    label: 'Discover',
    accent: '#7C3AED',
    title: 'Communities • Creators',
    description:
      'Find the best crypto communities, follow top creators and never miss real alpha again.',
    cta: 'Go to Discover',
    to: '/discover',
  },
];

const StaticBackground: React.FC<{ accent: string }> = ({ accent }) => (
  <div
    className="absolute inset-0"
    style={{
      background: `linear-gradient(135deg, ${accent}40 0%, ${accent}18 45%, #ffffff 100%)`,
    }}
    aria-hidden
  />
);

const PromoSlideContent: React.FC<{ slide: PromoSlide }> = ({ slide }) => (
  <div className="absolute inset-0 z-10 flex flex-col justify-center gap-3 px-4 pb-2">
    <div className="pointer-events-auto">
      <p className="text-xs font-semibold tracking-wide" style={{ color: slide.accent }}>
        {slide.label}
      </p>
      <h3 className="mt-1 text-lg font-bold leading-snug text-neutral-900">{slide.title}</h3>
      <p className="mt-1 max-w-[280px] text-sm text-neutral-600">{slide.description}</p>
      <Link
        to={slide.to}
        className="mt-4 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
        style={{ backgroundColor: slide.accent }}
      >
        {slide.cta}
      </Link>
    </div>
  </div>
);

type PromoSlideLayerProps = {
  slide: PromoSlide;
  webglOk: boolean;
};

const PromoSlideLayer: React.FC<PromoSlideLayerProps> = ({ slide, webglOk }) => (
  <>
    <StaticBackground accent={slide.accent} />
    {webglOk ? (
      <PixelBlastErrorBoundary fallback={<StaticBackground accent={slide.accent} />}>
        <PixelBlast
          variant="diamond"
          pixelSize={3}
          color={slide.accent}
          patternScale={5}
          patternDensity={2}
          enableRipples
          rippleSpeed={1}
          rippleThickness={0.1}
          rippleIntensityScale={3}
          speed={0.5}
          transparent
          edgeFade={0.5}
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
        />
      </PixelBlastErrorBoundary>
    ) : null}
    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/90 via-white/45 to-white/15" />
    <PromoSlideContent slide={slide} />
  </>
);

const HomeSidebarPromoCarousel: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [webglOk] = useState(canUseWebGL2);
  const slide = SLIDES[index];

  const goPrev = useCallback(() => {
    setDirection(-1);
    setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setIndex((i) => (i + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(goNext, AUTO_MS);
    return () => window.clearTimeout(timer);
  }, [index, goNext]);

  return (
    <div className="relative shrink-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="relative h-[200px] w-full">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={TRANSITION}
            className="absolute inset-0"
          >
            <PromoSlideLayer slide={slide} webglOk={webglOk} />
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-4 right-3 z-20 flex items-center gap-0.5 rounded-full border border-neutral-200/80 bg-white/85 px-1 py-0.5 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={goPrev}
            className="rounded-full p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[2rem] px-0.5 text-center text-xs font-medium tabular-nums text-neutral-600">
            {index + 1}/{SLIDES.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="rounded-full p-1 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-[3px] bg-neutral-200/70"
          aria-hidden
        >
          <div
            key={`progress-${index}`}
            className="home-sidebar-promo-progress h-full w-full origin-left"
            style={{
              backgroundColor: slide.accent,
              animationDuration: `${AUTO_MS}ms`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeSidebarPromoCarousel;
