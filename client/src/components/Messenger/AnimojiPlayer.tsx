import React, { useEffect, useRef, useState } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import { maxPickerLottieFallback } from '../../constants/messengerEmojis';

const PLACEHOLDER_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

interface AnimojiPlayerProps {
  emoji: string;
  lottieUrl: string;
  animojiId?: string;
  slug?: string;
  size?: number;
  className?: string;
}

function lottieSourceUrls(lottieUrl: string, slug?: string): string[] {
  const urls = [lottieUrl];
  if (slug) urls.push(maxPickerLottieFallback(slug));
  return urls;
}

async function fetchLottieData(url: string): Promise<object | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as object;
  } catch {
    return null;
  }
}

const AnimojiPlayer: React.FC<AnimojiPlayerProps> = ({
  emoji,
  lottieUrl,
  animojiId,
  slug,
  size = 20,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    setFailed(false);

    const load = async () => {
      for (const url of lottieSourceUrls(lottieUrl, slug)) {
        const data = await fetchLottieData(url);
        if (cancelled || !data || !containerRef.current) continue;

        animRef.current?.destroy();
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: 'canvas',
          loop: true,
          autoplay: true,
          animationData: data,
        });
        return;
      }

      if (!cancelled) setFailed(true);
    };

    void load();

    return () => {
      cancelled = true;
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [lottieUrl, slug]);

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label={emoji}
      >
        <span className="text-xl leading-none">{emoji}</span>
      </span>
    );
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      data-lexical-animoji=""
      data-lexical-animoji-id={animojiId}
      data-lexical-animoji-emoji={emoji}
      data-lexical-animoji-url={lottieUrl}
    >
      <img className="absolute inset-0 h-full w-full opacity-0" src={PLACEHOLDER_IMG} alt={emoji} draggable={false} />
      <span className="player flex items-center justify-center" style={{ width: size, height: size }}>
        <div ref={containerRef} style={{ width: size, height: size }} />
      </span>
    </span>
  );
};

export default AnimojiPlayer;
