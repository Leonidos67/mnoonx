import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CoinDetail } from '../types/ai';

export interface AIChatSeed {
  id: number;
  prompt: string;
  autoSend?: boolean;
  coinContext?: CoinDetail;
  locale?: 'en' | 'ru';
}

export interface AskAIOptions {
  autoSend?: boolean;
  coinContext?: CoinDetail;
  locale?: 'en' | 'ru';
}

interface AIChatPanelContextValue {
  isOpen: boolean;
  chatSeed: AIChatSeed | null;
  lastProcessedSeedId: number;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  askAI: (prompt: string, options?: AskAIOptions) => void;
  markSeedProcessed: (id: number) => void;
}

const AIChatPanelContext = createContext<AIChatPanelContextValue | null>(null);

export const AIChatPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chatSeed, setChatSeed] = useState<AIChatSeed | null>(null);
  const [lastProcessedSeedId, setLastProcessedSeedId] = useState(0);
  const seedCounter = useRef(0);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((o) => !o), []);

  const askAI = useCallback((prompt: string, options?: AskAIOptions) => {
    seedCounter.current += 1;
    setChatSeed({
      id: seedCounter.current,
      prompt,
      autoSend: options?.autoSend,
      coinContext: options?.coinContext,
      locale: options?.locale,
    });
    setIsOpen(true);
  }, []);

  const markSeedProcessed = useCallback((id: number) => {
    setLastProcessedSeedId((prev) => Math.max(prev, id));
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      chatSeed,
      lastProcessedSeedId,
      openPanel,
      closePanel,
      togglePanel,
      askAI,
      markSeedProcessed,
    }),
    [isOpen, chatSeed, lastProcessedSeedId, openPanel, closePanel, togglePanel, askAI, markSeedProcessed]
  );

  return <AIChatPanelContext.Provider value={value}>{children}</AIChatPanelContext.Provider>;
};

export function useAIChatPanel(): AIChatPanelContextValue {
  const ctx = useContext(AIChatPanelContext);
  if (!ctx) {
    throw new Error('useAIChatPanel must be used within AIChatPanelProvider');
  }
  return ctx;
}
