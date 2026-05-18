import React, { useId, useMemo } from 'react';

interface MiniSparklineProps {
  points: number[];
  positive?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

const MiniSparkline: React.FC<MiniSparklineProps> = ({
  points,
  positive,
  width = 96,
  height = 40,
  className = '',
}) => {
  const gradId = useId().replace(/:/g, '');

  const { linePath, areaPath, stroke } = useMemo(() => {
    const valid = points.filter((p) => typeof p === 'number' && Number.isFinite(p));
    if (valid.length < 2) {
      return { linePath: '', areaPath: '', stroke: '#16a34a' };
    }

    const min = Math.min(...valid);
    const max = Math.max(...valid);
    const range = max - min || max * 0.001 || 1;
    const padY = 4;

    const coords = valid.map((p, i) => {
      const x = (i / (valid.length - 1)) * width;
      const y = height - padY - ((p - min) / range) * (height - padY * 2);
      return { x, y };
    });

    const line = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const lineD = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const area = `${lineD} L ${width} ${height} L 0 ${height} Z`;

    const color = (positive ?? valid[valid.length - 1] >= valid[0]) ? '#16a34a' : '#dc2626';

    return { linePath: line, areaPath: area, stroke: color };
  }, [points, positive, width, height]);

  if (!linePath) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePath}
      />
    </svg>
  );
};

export default MiniSparkline;
