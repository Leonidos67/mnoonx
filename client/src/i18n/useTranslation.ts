import { useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { en } from './messages/en';
import { ru } from './messages/ru';

export type Messages = typeof en;

function getString(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return typeof cur === 'string' ? cur : undefined;
}

export function useTranslation() {
  const { locale } = useLanguage();
  const dict = locale === 'ru' ? ru : en;

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let s = getString(dict, key) ?? getString(en, key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.split(`{${k}}`).join(String(v));
        }
      }
      return s;
    },
    [dict]
  );

  return { t, locale };
}
