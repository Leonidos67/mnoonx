/** ID приложений сообщества (совпадают с server ALLOWED_COMMUNITY_APPS и т.д.) */
export const COMMUNITY_APP_IDS = {
  CHAT: 'chat',
  COURSES: 'courses',
  CONTENT: 'content',
  FILES: 'files',
  ANNOUNCEMENTS: 'announcements',
  EVENTS: 'events',
  AI: 'ai',
  KANBAN: 'kanban',
  FORMS: 'forms',
} as const;

export type CommunityAppId = (typeof COMMUNITY_APP_IDS)[keyof typeof COMMUNITY_APP_IDS];
