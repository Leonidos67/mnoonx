import type { DocsArticleProps } from '../components/Docs/DocsArticle';
import type { AppLocale } from '../context/LanguageContext';
import { applyDocsEnrichmentEn } from './docsEnrichment.en';
import { applyDocsEnrichmentRu } from './docsEnrichment.ru';
import { PAGES_EN } from './docsPages.en';
import { PAGES_RU } from './docsPages.ru';
import type { DocsPageKey } from './docsPagesShared';

export function getDocsPageContent(
  sectionId: string,
  pageSlug: string,
  locale: AppLocale
): Omit<DocsArticleProps, 'prev' | 'next'> | null {
  const key = `${sectionId}/${pageSlug}` as DocsPageKey;
  const pages = locale === 'ru' ? PAGES_RU : PAGES_EN;
  const base = pages[key];
  if (!base) return null;
  return locale === 'ru' ? applyDocsEnrichmentRu(key, base) : applyDocsEnrichmentEn(key, base);
}
