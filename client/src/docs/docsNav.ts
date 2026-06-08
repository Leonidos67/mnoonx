import type { AppLocale } from '../context/LanguageContext';
import { en } from '../i18n/messages/en';
import { ru } from '../i18n/messages/ru';
import { DOCS_SECTION_STRUCTURE } from './docsSectionStructure';

export interface DocsNavItem {
  slug: string;
  title: string;
}

export interface DocsNavSection {
  id: string;
  sidebarLabel: string;
  items: DocsNavItem[];
}

function docsMessagesFor(locale: AppLocale) {
  return locale === 'ru' ? ru.docs : en.docs;
}

function pageTitle(messages: ReturnType<typeof docsMessagesFor>, sectionId: string, slug: string): string {
  const pages = messages.nav.pages as Record<string, Record<string, string>>;
  return pages[sectionId]?.[slug] ?? slug;
}

export function buildDocsSections(locale: AppLocale): DocsNavSection[] {
  const messages = docsMessagesFor(locale);
  return DOCS_SECTION_STRUCTURE.map((section) => ({
    id: section.id,
    sidebarLabel: messages.nav.sections[section.id as keyof typeof messages.nav.sections],
    items: section.items.map((slug) => ({
      slug,
      title: pageTitle(messages, section.id, slug),
    })),
  }));
}

/** @deprecated Use buildDocsSections(locale) — kept for search index bootstrap */
export const DOCS_SECTIONS: DocsNavSection[] = buildDocsSections('ru');

export const DOCS_DEFAULT_PATH = '/docs/start/overview';
export const DOCS_SUPPORT_PATH = '/docs/support';

export type DocsHeaderNavId = 'docs' | 'support';

export interface DocsHeaderNavItem {
  id: DocsHeaderNavId;
  labelKey: 'docs.header.docs' | 'docs.header.support';
  to: string;
}

export const DOCS_HEADER_NAV: DocsHeaderNavItem[] = [
  { id: 'docs', labelKey: 'docs.header.docs', to: DOCS_DEFAULT_PATH },
  { id: 'support', labelKey: 'docs.header.support', to: DOCS_SUPPORT_PATH },
];

export function isDocsHeaderNavActive(pathname: string, id: DocsHeaderNavId): boolean {
  if (id === 'support') {
    return pathname === DOCS_SUPPORT_PATH || pathname.startsWith(`${DOCS_SUPPORT_PATH}/`);
  }
  if (!pathname.startsWith('/docs')) return false;
  if (pathname === DOCS_SUPPORT_PATH || pathname.startsWith(`${DOCS_SUPPORT_PATH}/`)) {
    return false;
  }
  return true;
}

export function docsPagePath(sectionId: string, pageSlug: string): string {
  return `/docs/${sectionId}/${pageSlug}`;
}

export function findDocsNavItem(
  sectionId: string,
  pageSlug: string,
  locale: AppLocale = 'ru'
): DocsNavItem | null {
  const section = buildDocsSections(locale).find((s) => s.id === sectionId);
  if (!section) return null;
  return section.items.find((i) => i.slug === pageSlug) ?? null;
}

export function findDocsSection(sectionId: string, locale: AppLocale = 'ru'): DocsNavSection | null {
  return buildDocsSections(locale).find((s) => s.id === sectionId) ?? null;
}

export function getAdjacentDocsPages(
  sectionId: string,
  pageSlug: string,
  locale: AppLocale = 'ru'
): {
  prev: { path: string; title: string } | null;
  next: { path: string; title: string } | null;
} {
  const flat = buildDocsSections(locale).flatMap((s) =>
    s.items.map((i) => ({ sectionId: s.id, ...i }))
  );
  const idx = flat.findIndex((p) => p.sectionId === sectionId && p.slug === pageSlug);
  if (idx < 0) return { prev: null, next: null };
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  return {
    prev: prev ? { path: docsPagePath(prev.sectionId, prev.slug), title: prev.title } : null,
    next: next ? { path: docsPagePath(next.sectionId, next.slug), title: next.title } : null,
  };
}
