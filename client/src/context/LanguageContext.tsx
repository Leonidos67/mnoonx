import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AppLocale = 'en' | 'ru';

const STORAGE_KEY = 'mnoonx-locale';

function readStoredLocale(): AppLocale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'ru' || v === 'en') return v;
  } catch {
    /* ignore */
  }
  return 'en';
}

interface LanguageContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    typeof window !== 'undefined' ? readStoredLocale() : 'en'
  );

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
