import React, { useEffect, useMemo } from 'react';
import { TonConnectUIProvider, useTonConnectUI, THEME } from '@tonconnect/ui-react';
import { useLanguage } from '../../context/LanguageContext';
import { tonConnectManifestUrl } from '../../utils/tonConnect';

type Props = {
  children: React.ReactNode;
};

const TonConnectUiSync: React.FC = () => {
  const { locale } = useLanguage();
  const [tonConnectUi] = useTonConnectUI();

  useEffect(() => {
    tonConnectUi.uiOptions = {
      language: locale === 'ru' ? 'ru' : 'en',
      uiPreferences: { theme: THEME.LIGHT },
    };
  }, [locale, tonConnectUi]);

  return null;
};

const TonConnectAppProvider: React.FC<Props> = ({ children }) => {
  const manifestUrl = useMemo(() => tonConnectManifestUrl(), []);

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl} analytics={{ mode: 'off' }}>
      <TonConnectUiSync />
      {children}
    </TonConnectUIProvider>
  );
};

export default TonConnectAppProvider;
