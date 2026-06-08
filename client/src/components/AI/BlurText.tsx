import { motion, type Transition } from 'motion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type MotionSnapshot = Record<string, string | number>;

export interface BlurTextProps {
  text?: string;
  delay?: number;
  delayOffset?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: MotionSnapshot;
  animationTo?: MotionSnapshot;
  easing?: Transition['ease'];
  onAnimationComplete?: () => void;
  stepDuration?: number;
  startImmediately?: boolean;
  as?: 'p' | 'span' | 'div';
}

const BlurText: React.FC<BlurTextProps> = ({
  text = '',
  delay = 20,
  delayOffset = 0,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = [0.22, 1, 0.36, 1],
  onAnimationComplete,
  stepDuration = 0.18,
  startImmediately = false,
  as = 'p',
}) => {
  const elements = useMemo(
    () => (animateBy === 'words' ? text.split(' ').filter(Boolean) : text.split('')),
    [animateBy, text]
  );
  const [inView, setInView] = useState(startImmediately);
  const [revealedCount, setRevealedCount] = useState(0);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (startImmediately) {
      setInView(true);
      return undefined;
    }

    if (!ref.current) return undefined;

    const node = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [startImmediately, threshold, rootMargin]);

  useEffect(() => {
    if (!inView || elements.length === 0) {
      setRevealedCount(0);
      return undefined;
    }

    setRevealedCount(0);
    const timers = elements.map((_, index) =>
      window.setTimeout(() => {
        setRevealedCount(index + 1);
      }, delayOffset + index * delay)
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [inView, elements.length, delay, delayOffset, text]);

  const fromSnapshot = useMemo(
    () =>
      animationFrom ??
      (direction === 'top'
        ? { filter: 'blur(8px)', opacity: 0, y: -8 }
        : { filter: 'blur(8px)', opacity: 0, y: 8 }),
    [animationFrom, direction]
  );

  const toSnapshot = useMemo(
    () => animationTo ?? { filter: 'blur(0px)', opacity: 1, y: 0 },
    [animationTo]
  );

  const Tag = as;
  const layoutClass =
    'min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-word]';

  if (!text.trim()) return null;

  return (
    <Tag
      ref={ref as React.Ref<HTMLParagraphElement>}
      className={`${layoutClass} ${className}`.trim()}
    >
      {elements.slice(0, revealedCount).map((segment, index) => (
        <motion.span
          className="inline will-change-[transform,filter,opacity]"
          key={`${segment}-${index}`}
          initial={fromSnapshot}
          animate={toSnapshot}
          transition={{ duration: stepDuration, ease: easing }}
          onAnimationComplete={
            index === elements.length - 1 && revealedCount === elements.length
              ? onAnimationComplete
              : undefined
          }
        >
          {segment}
          {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : null}
        </motion.span>
      ))}
    </Tag>
  );
};

export default BlurText;
