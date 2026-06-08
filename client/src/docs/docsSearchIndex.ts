import type { AppLocale } from '../context/LanguageContext';
import { buildDocsSections, docsPagePath } from './docsNav';

export interface DocsSearchHit {
  sectionId: string;
  pageSlug: string;
  title: string;
  sectionTitle: string;
  path: string;
}

export function buildDocsSearchIndex(locale: AppLocale): DocsSearchHit[] {
  return buildDocsSections(locale).flatMap((section) =>
    section.items.map((item) => ({
      sectionId: section.id,
      pageSlug: item.slug,
      title: item.title,
      sectionTitle: section.sidebarLabel,
      path: docsPagePath(section.id, item.slug),
    }))
  );
}

export function searchDocs(query: string, locale: AppLocale, limit = 8): DocsSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return buildDocsSearchIndex(locale).filter(
    (hit) =>
      hit.title.toLowerCase().includes(q) ||
      hit.sectionTitle.toLowerCase().includes(q)
  ).slice(0, limit);
}
