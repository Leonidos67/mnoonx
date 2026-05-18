import React, { type CSSProperties } from 'react';

const GRID_MASK_STYLE: CSSProperties = {
  backgroundImage: `
    linear-gradient(to right, #e7e5e4 1px, transparent 1px),
    linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
  `,
  backgroundSize: '20px 20px',
  backgroundPosition: '0 0, 0 0',
  maskImage: `
    repeating-linear-gradient(
      to right,
      black 0px,
      black 3px,
      transparent 3px,
      transparent 8px
    ),
    repeating-linear-gradient(
      to bottom,
      black 0px,
      black 3px,
      transparent 3px,
      transparent 8px
    ),
    radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)
  `,
  WebkitMaskImage: `
    repeating-linear-gradient(
      to right,
      black 0px,
      black 3px,
      transparent 3px,
      transparent 8px
    ),
    repeating-linear-gradient(
      to bottom,
      black 0px,
      black 3px,
      transparent 3px,
      transparent 8px
    ),
    radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)
  `,
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
};

/** Dashed grid fade pinned to the main content panel (Discover → Market tab). */
const DiscoverMarketGridBackground: React.FC = () => (
  <div
    className="pointer-events-none absolute inset-0 z-0"
    style={GRID_MASK_STYLE}
    aria-hidden
  />
);

export default DiscoverMarketGridBackground;
