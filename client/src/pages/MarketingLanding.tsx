import React, { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import { setDocumentMeta } from '../utils/documentMeta';
import LaserFlow from '../components/Common/LaserFlow/LaserFlow';

const openRegister = () => window.location.href = '/discover';

/** Site accent blue (`#315efb`) + dark blue-black surfaces. */
const BG = '#02060F';
const PANEL_BG = '#060B18';
const LASER = '#315efb';
const BORDER = '#315efb';
const BLUE_RGB = '49,94,251';

const DOT_GRID = `radial-gradient(rgba(${BLUE_RGB},0.28) 1px, transparent 1px)`;

/**
 * LaserFlow interactive reveal — laser locked to panel top edge.
 */
const MarketingLanding: React.FC = () => {
  const { t } = useTranslation();
  const revealTextRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  /** Maps panel top → LaserFlow verticalBeamOffset (0 = screen center). */
  const [beamY, setBeamY] = useState(-0.25);
  /** Stretch beam so its tip sits on the viewport top. */
  const [beamLen, setBeamLen] = useState(3.2);

  useEffect(() => {
    return setDocumentMeta({
      title: 'MNOONX',
      description: t('marketingLanding.metaDescription'),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    });
  }, [t]);

  useLayoutEffect(() => {
    const hero = heroRef.current;
    const panel = panelRef.current;
    if (!hero || !panel) return;

    const syncBeam = () => {
      const hr = hero.getBoundingClientRect();
      const pr = panel.getBoundingClientRect();
      if (hr.height < 1) return;
      const topFrac = (pr.top - hr.top) / hr.height;
      setBeamY(0.5 - topFrac);
      // UV scale in LaserFlow ≈ 204.8; R_V = 150. Size so tip reaches viewport top.
      const uvToTop = topFrac * 204.8;
      setBeamLen(Math.max(2.4, (uvToTop / 150) * 1.35));
    };

    syncBeam();
    const raf = requestAnimationFrame(syncBeam);
    const ro = new ResizeObserver(syncBeam);
    ro.observe(hero);
    ro.observe(panel);
    window.addEventListener('resize', syncBeam);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', syncBeam);
    };
  }, []);

  const revealTextStyle = {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: '28%',
    pointerEvents: 'none',
    userSelect: 'none',
    fontFamily: '"Archivo Black", sans-serif',
    fontSize: 'clamp(3.5rem, 16vw, 12rem)',
    fontWeight: 400,
    letterSpacing: '-0.06em',
    lineHeight: 1,
    color: `rgba(${BLUE_RGB},0.22)`,
    textShadow: `
      0 0 60px rgba(${BLUE_RGB},0.35),
      0 0 140px rgba(${BLUE_RGB},0.2)
    `,
    mixBlendMode: 'screen',
    ['--mx' as string]: '50%',
    ['--my' as string]: '35%',
    WebkitMaskImage:
      'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.85) 120px, rgba(255,255,255,0.45) 220px, rgba(255,255,255,0.2) 340px, rgba(255,255,255,0.08) 100%)',
    maskImage:
      'radial-gradient(circle at var(--mx) var(--my), rgba(255,255,255,1) 0px, rgba(255,255,255,0.85) 120px, rgba(255,255,255,0.45) 220px, rgba(255,255,255,0.2) 340px, rgba(255,255,255,0.08) 100%)',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
  } as CSSProperties;

  return (
    <div
      ref={heroRef}
      style={{
        height: '100dvh',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: BG,
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const el = revealTextRef.current;
        if (el) {
          el.style.setProperty('--mx', `${x}px`);
          el.style.setProperty('--my', `${y}px`);
        }
      }}
      onMouseLeave={() => {
        const el = revealTextRef.current;
        if (el) {
          el.style.setProperty('--mx', '50%');
          el.style.setProperty('--my', '35%');
        }
      }}
    >
      <LaserFlow
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        horizontalBeamOffset={0}
        verticalBeamOffset={beamY}
        verticalSizing={beamLen}
        color={LASER}
        fogIntensity={0.55}
        fogScale={0.28}
        wispIntensity={6}
        flowSpeed={0.32}
        decay={1.15}
        falloffStart={1.25}
      />

      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          top: '75%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          height: '25%',
          zIndex: 6,
          borderRadius: '22px 22px 0 0',
          border: 'none',
          borderTop: `1.5px solid ${BORDER}`,
          backgroundColor: PANEL_BG,
          backgroundImage: DOT_GRID,
          backgroundSize: '22px 22px',
          backgroundPosition: 'center top',
          boxShadow: `
            0 -1px 0 0 rgba(${BLUE_RGB},0.4) inset,
            0 -28px 70px -18px rgba(${BLUE_RGB},0.45)
          `,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '2rem 1.5rem',
          boxSizing: 'border-box',
          textAlign: 'center',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '55%',
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(${BLUE_RGB},0.95) 35%, rgba(255,255,255,0.9) 50%, rgba(${BLUE_RGB},0.95) 65%, transparent)`,
            boxShadow: `0 0 28px 6px rgba(${BLUE_RGB},0.55)`,
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '42%',
            height: 90,
            background: `radial-gradient(ellipse at 50% 0%, rgba(${BLUE_RGB},0.32) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />

        <h1
          style={{
            position: 'relative',
            margin: 0,
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontSize: 'clamp(1.5rem, 4vw, 2.35rem)',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#F0F4FF',
            textShadow: `0 0 40px rgba(${BLUE_RGB},0.3)`,
          }}
        >
          {t('marketingLanding.heroHeadline')}
        </h1>
        <p
          style={{
            position: 'relative',
            margin: '1rem 0 0',
            maxWidth: 520,
            fontFamily: '"Space Grotesk", system-ui, sans-serif',
            fontSize: 'clamp(0.95rem, 2vw, 1.125rem)',
            lineHeight: 1.55,
            color: 'rgba(190,205,245,0.7)',
          }}
        >
          {t('marketingLanding.heroSub')}
        </p>
        <div
          style={{
            position: 'relative',
            marginTop: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={openRegister}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 12,
              border: 'none',
              background: `linear-gradient(180deg, #6B9BFF 0%, ${LASER} 45%, #2547c4 100%)`,
              color: '#fff',
              fontFamily: '"Space Grotesk", system-ui, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              padding: '12px 22px',
              cursor: 'pointer',
              boxShadow: `0 0 28px rgba(${BLUE_RGB},0.5), 0 1px 0 rgba(255,255,255,0.25) inset`,
            }}
          >
            {t('marketingLanding.ctaPrimary')}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div ref={revealTextRef} aria-hidden style={revealTextStyle}>
        MNOONX
      </div>
    </div>
  );
};

export default MarketingLanding;
