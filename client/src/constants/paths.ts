/** Профиль в приложении всегда как `/@username` */
export const profilePath = (username: string) => {
  const u = String(username).replace(/^@/, '').trim();
  return u ? `/@${encodeURIComponent(u)}` : '/';
};
