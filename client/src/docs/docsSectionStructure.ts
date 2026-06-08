/** Docs IA — section ids and page slugs (titles come from i18n). */
export const DOCS_SECTION_STRUCTURE = [
  { id: 'start', items: ['overview', 'account', 'navigation'] as const },
  { id: 'profile', items: ['basics', 'connections'] as const },
  {
    id: 'community',
    items: ['roadmap', 'create', 'access', 'branding', 'members', 'feed'] as const,
  },
  {
    id: 'apps',
    items: [
      'overview',
      'store',
      'install',
      'configure',
      'chat',
      'courses',
      'content',
      'files',
      'announcements',
      'events',
    ] as const,
  },
  { id: 'dashboard', items: ['overview', 'analytics', 'members'] as const },
  { id: 'social', items: ['posts', 'messenger', 'discover'] as const },
  { id: 'growth', items: ['strategy', 'monetization', 'checklist'] as const },
] as const;

export type DocsSectionId = (typeof DOCS_SECTION_STRUCTURE)[number]['id'];
