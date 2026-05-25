export interface DocsNavItem {
  slug: string;
  title: string;
}

export interface DocsNavSection {
  id: string;
  /** Группа в левом сайдбаре */
  sidebarLabel: string;
  items: DocsNavItem[];
}

export const DOCS_SECTIONS: DocsNavSection[] = [
  {
    id: 'start',
    sidebarLabel: 'Начало работы',
    items: [
      { slug: 'overview', title: 'Обзор платформы' },
      { slug: 'account', title: 'Аккаунт и вход' },
      { slug: 'navigation', title: 'Навигация' },
    ],
  },
  {
    id: 'profile',
    sidebarLabel: 'Профиль',
    items: [
      { slug: 'basics', title: 'Профиль и лента' },
      { slug: 'connections', title: 'Подписки и связи' },
    ],
  },
  {
    id: 'community',
    sidebarLabel: 'Сообщества',
    items: [
      { slug: 'roadmap', title: 'План запуска' },
      { slug: 'create', title: 'Создание сообщества' },
      { slug: 'access', title: 'Доступ и приватность' },
      { slug: 'branding', title: 'Оформление' },
      { slug: 'members', title: 'Участники' },
      { slug: 'feed', title: 'Лента сообщества' },
    ],
  },
  {
    id: 'apps',
    sidebarLabel: 'Приложения',
    items: [
      { slug: 'overview', title: 'Что такое приложения' },
      { slug: 'store', title: 'Магазин приложений' },
      { slug: 'install', title: 'Установка' },
      { slug: 'configure', title: 'Настройка экземпляров' },
      { slug: 'chat', title: 'Чат' },
      { slug: 'courses', title: 'Курсы' },
      { slug: 'content', title: 'Контент' },
      { slug: 'files', title: 'Файлы' },
      { slug: 'announcements', title: 'Объявления' },
      { slug: 'events', title: 'События' },
    ],
  },
  {
    id: 'dashboard',
    sidebarLabel: 'Панель владельца',
    items: [
      { slug: 'overview', title: 'Панель владельца' },
      { slug: 'analytics', title: 'Аналитика' },
      { slug: 'members', title: 'Участники и роли' },
    ],
  },
  {
    id: 'social',
    sidebarLabel: 'Социальные функции',
    items: [
      { slug: 'posts', title: 'Посты и взаимодействия' },
      { slug: 'messenger', title: 'Мессенджер' },
      { slug: 'discover', title: 'Discover' },
    ],
  },
  {
    id: 'growth',
    sidebarLabel: 'Развитие',
    items: [
      { slug: 'strategy', title: 'Стратегия роста' },
      { slug: 'monetization', title: 'Монетизация' },
      { slug: 'checklist', title: 'Чеклист запуска' },
    ],
  },
];

export const DOCS_DEFAULT_PATH = '/docs/start/overview';
export const DOCS_SUPPORT_PATH = '/docs/support';

/** Верхняя навигация в шапке: Docs | Support */
export type DocsHeaderNavId = 'docs' | 'support';

export interface DocsHeaderNavItem {
  id: DocsHeaderNavId;
  label: string;
  to: string;
}

export const DOCS_HEADER_NAV: DocsHeaderNavItem[] = [
  { id: 'docs', label: 'Docs', to: DOCS_DEFAULT_PATH },
  { id: 'support', label: 'Support', to: DOCS_SUPPORT_PATH },
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

export function findDocsNavItem(sectionId: string, pageSlug: string): DocsNavItem | null {
  const section = DOCS_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  return section.items.find((i) => i.slug === pageSlug) ?? null;
}

export function findDocsSection(sectionId: string): DocsNavSection | null {
  return DOCS_SECTIONS.find((s) => s.id === sectionId) ?? null;
}

export function getAdjacentDocsPages(sectionId: string, pageSlug: string): {
  prev: { path: string; title: string } | null;
  next: { path: string; title: string } | null;
} {
  const flat = DOCS_SECTIONS.flatMap((s) =>
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
