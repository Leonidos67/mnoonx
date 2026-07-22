/** API origin without trailing slash. Set REACT_APP_API_URL in Vercel / .env */
const trimSlash = (url: string) => url.replace(/\/+$/, '');

export const API_ORIGIN = trimSlash(
  process.env.REACT_APP_API_URL || 'http://localhost:5000',
);

export const API_BASE = `${API_ORIGIN}/api`;

export const AUTH_API = `${API_BASE}/auth`;
export const POSTS_API = `${API_BASE}/posts`;
export const USERS_API = `${API_BASE}/users`;
export const COMMUNITIES_API = `${API_BASE}/communities`;
export const NOTIFICATIONS_API = `${API_BASE}/notifications`;
export const MESSAGES_API = `${API_BASE}/messages`;
export const AI_API = `${API_BASE}/ai`;
export const ADMIN_API = `${API_BASE}/admin`;
export const SUPPORT_API = `${API_BASE}/support`;
export const PORTFOLIO_API = `${API_BASE}/portfolio`;
export const PUSH_API = `${API_BASE}/push`;
export const LINK_PREVIEW_API = `${API_BASE}/link-preview`;
export const BROWSE_API = `${API_BASE}/browse`;
export const REPORTS_API = `${API_BASE}/reports`;
export const OG_API = `${API_BASE}/og`;
