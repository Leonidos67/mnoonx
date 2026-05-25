import { DOCS_SECTIONS, docsPagePath } from './docsNav';

export interface DocsSearchHit {
  sectionId: string;
  pageSlug: string;
  title: string;
  sectionTitle: string;
  path: string;
}

export const DOCS_SEARCH_INDEX: DocsSearchHit[] = DOCS_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({
    sectionId: section.id,
    pageSlug: item.slug,
    title: item.title,
    sectionTitle: section.sidebarLabel,
    path: docsPagePath(section.id, item.slug),
  }))
);

export function searchDocs(query: string, limit = 8): DocsSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DOCS_SEARCH_INDEX.filter(
    (hit) =>
      hit.title.toLowerCase().includes(q) ||
      hit.sectionTitle.toLowerCase().includes(q)
  ).slice(0, limit);
}
