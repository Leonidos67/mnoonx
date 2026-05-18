import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface AIChatPanelContextValue {
  isOpen: boolean;
  promptSeed: string;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  askAI: (prompt: string) => void;
}

const AIChatPanelContext = createContext<AIChatPanelContextValue | null>(null);

export const AIChatPanelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [promptSeed, setPromptSeed] = useState('');

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((o) => !o), []);

  const askAI = useCallback((prompt: string) => {
    setPromptSeed(prompt);
    setIsOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      promptSeed,
      openPanel,
      closePanel,
      togglePanel,
      askAI,
    }),
    [isOpen, promptSeed, openPanel, closePanel, togglePanel, askAI]
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
