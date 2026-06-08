import React, { useEffect } from 'react';
import AIChat from './AIChat';
import MobileBottomSheet from '../Common/MobileBottomSheet';
import { useAIChatPanel } from '../../context/AIChatPanelContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const LG_MEDIA = '(min-width: 1024px)';

/** Desktop: right column. Mobile: Vaul bottom sheet with swipe dismiss. */
const AIChatDrawer: React.FC = () => {
  const { isOpen, closePanel, chatSeed } = useAIChatPanel();
  const isDesktop = useMediaQuery(LG_MEDIA);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closePanel]);

  if (!isDesktop) {
    return (
      <MobileBottomSheet
        open={isOpen}
        onClose={closePanel}
        title="MNOONX AI"
        padded={false}
        zIndexClass="z-[110]"
        contentClassName="max-h-[88dvh]"
      >
        <div className="flex h-[min(82dvh,720px)] min-h-[360px] flex-col">
          <AIChat chatSeed={chatSeed} onCollapse={closePanel} />
        </div>
      </MobileBottomSheet>
    );
  }

  return (
    <aside
      aria-label="MNOONX AI"
      aria-hidden={!isOpen}
      className={`flex shrink-0 flex-col overflow-hidden border-[#e7e7e7] bg-white transition-[width,height,border-color] duration-300 ease-out ${
        isOpen
          ? 'h-full w-[min(380px,36vw)] max-w-[420px] border-l'
          : 'h-0 w-0 border-transparent'
      }`}
    >
      {isOpen && (
        <div className="flex h-full min-h-0 w-full min-w-[340px] flex-col">
          <AIChat chatSeed={chatSeed} onCollapse={closePanel} />
        </div>
      )}
    </aside>
  );
};

export default AIChatDrawer;
