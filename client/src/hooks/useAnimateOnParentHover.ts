import { useEffect, type RefObject } from 'react';
import type { IconHandle } from '@animateicons/react/lucide';

const HOVER_PARENT_SELECTOR =
  'button, a, [role="menuitem"], [role="button"], [data-animate-hover]';

/**
 * Bind icon animation to hover on the nearest interactive ancestor
 * (button / link / menuitem), not just the icon glyph.
 */
export function useAnimateOnParentHover(
  iconRef: RefObject<IconHandle | null>,
  nodeRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const parent = node.closest(HOVER_PARENT_SELECTOR) as HTMLElement | null;
    if (!parent) return;

    const onEnter = () => iconRef.current?.startAnimation();
    const onLeave = () => iconRef.current?.stopAnimation();

    parent.addEventListener('mouseenter', onEnter);
    parent.addEventListener('mouseleave', onLeave);
    return () => {
      parent.removeEventListener('mouseenter', onEnter);
      parent.removeEventListener('mouseleave', onLeave);
    };
  }, [iconRef, nodeRef]);
}
