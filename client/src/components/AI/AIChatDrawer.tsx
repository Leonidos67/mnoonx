import React, { useEffect } from 'react';
import AIChat from './AIChat';
import { useAIChatPanel } from '../../context/AIChatPanelContext';

/** Right column of the layout — not a modal; shares space with page content */
const AIChatDrawer: React.FC = () => {
  const { isOpen, closePanel, promptSeed } = useAIChatPanel();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, closePanel]);

  return (
    <aside
      aria-label="MNOONX AI"
      aria-hidden={!isOpen}
      className={`flex shrink-0 flex-col overflow-hidden border-[#e7e7e7] bg-white transition-[width,height,border-color] duration-300 ease-out ${
        isOpen
          ? 'h-[min(46vh,440px)] w-full border-t max-lg:min-h-[280px] lg:h-full lg:w-[min(380px,36vw)] lg:max-w-[420px] lg:border-l lg:border-t-0'
          : 'h-0 w-0 border-transparent max-lg:h-0'
      }`}
    >
      {isOpen && (
        <div className="flex h-full min-h-0 w-full min-w-[280px] flex-col lg:min-w-[340px]">
          <AIChat promptSeed={promptSeed} onCollapse={closePanel} />
        </div>
      )}
    </aside>
  );
};

export default AIChatDrawer;
