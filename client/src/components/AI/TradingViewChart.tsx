import React, { useEffect, useRef, useState } from 'react';

function toTradingViewSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (!s) return 'BINANCE:BTCUSDT';
  if (s.includes(':')) return s;
  return `BINANCE:${s}USDT`;
}

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  fillParent?: boolean;
  className?: string;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'BTC',
  height = 420,
  fillParent = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [parentHeight, setParentHeight] = useState(fillParent ? 0 : height);
  const tvSymbol = toTradingViewSymbol(symbol);

  useEffect(() => {
    if (!fillParent || !containerRef.current) return undefined;

    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h && h > 0) setParentHeight(Math.floor(h));
    });
    ro.observe(el);
    setParentHeight(Math.floor(el.getBoundingClientRect().height) || height);

    return () => ro.disconnect();
  }, [fillParent, height]);

  const widgetHeight = fillParent ? Math.max(parentHeight, 200) : height;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || (fillParent && widgetHeight < 100)) return;

    el.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    wrapper.style.height = `${widgetHeight}px`;
    wrapper.style.width = '100%';

    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    inner.style.height = '100%';
    inner.style.width = '100%';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: 'D',
      timezone: 'Etc/UTC',
      theme: 'light',
      style: '1',
      locale: 'en',
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      support_host: 'https://www.tradingview.com',
    });

    wrapper.appendChild(inner);
    wrapper.appendChild(script);
    el.appendChild(wrapper);

    return () => {
      el.innerHTML = '';
    };
  }, [tvSymbol, widgetHeight, fillParent]);

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${fillParent ? 'h-full min-h-0 w-full' : 'rounded-2xl border border-neutral-200 bg-white'} ${className}`}
      style={fillParent ? undefined : { minHeight: height }}
    />
  );
};

export default TradingViewChart;
