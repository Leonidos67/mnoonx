import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ExternalLinkGateModal from '../components/Common/ExternalLinkGateModal';
import InAppBrowser from '../components/Common/InAppBrowser';
import { isSameOriginUrl, normalizeExternalUrl } from '../utils/externalLinks';
import { getLinkOpenPreference } from '../utils/linkOpenPreferences';

type GateState = { url: string } | null;
type BrowserState = { url: string } | null;

interface InAppBrowserContextValue {
  openExternalLink: (rawUrl: string) => void;
}

const InAppBrowserContext = createContext<InAppBrowserContextValue | null>(null);

export const InAppBrowserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gate, setGate] = useState<GateState>(null);
  const [browser, setBrowser] = useState<BrowserState>(null);

  const openExternalLink = useCallback((rawUrl: string) => {
    const href = normalizeExternalUrl(rawUrl);
    if (!href) return;

    if (isSameOriginUrl(href)) {
      window.location.assign(href);
      return;
    }

    const preference = getLinkOpenPreference();
    if (preference === 'here') {
      setBrowser({ url: href });
      return;
    }
    if (preference === 'newTab') {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }

    setGate({ url: href });
  }, []);

  const closeGate = useCallback(() => setGate(null), []);

  const openHere = useCallback(() => {
    if (!gate) return;
    const { url } = gate;
    setGate(null);
    setBrowser({ url });
  }, [gate]);

  const openNewTab = useCallback(() => {
    if (!gate) return;
    window.open(gate.url, '_blank', 'noopener,noreferrer');
    setGate(null);
  }, [gate]);

  const value = useMemo(() => ({ openExternalLink }), [openExternalLink]);

  return (
    <InAppBrowserContext.Provider value={value}>
      {children}
      <ExternalLinkGateModal
        open={Boolean(gate)}
        url={gate?.url ?? ''}
        onClose={closeGate}
        onOpenHere={openHere}
        onOpenNewTab={openNewTab}
      />
      <InAppBrowser
        open={Boolean(browser)}
        url={browser?.url ?? ''}
        onClose={() => setBrowser(null)}
      />
    </InAppBrowserContext.Provider>
  );
};

export function useInAppBrowser(): InAppBrowserContextValue {
  const ctx = useContext(InAppBrowserContext);
  if (!ctx) {
    throw new Error('useInAppBrowser must be used within InAppBrowserProvider');
  }
  return ctx;
}
