import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import NotFound from '../../pages/NotFound';

/** Один сегмент пути, который не является профилем `/@name` */
const RESERVED = new Set([
  'discover',
  'settings',
  'messenger',
  'new',
  'community',
  'post',
  'plan',
  'create-community',
  'notifications',
  'users',
  'ai',
  'dashboard',
  'activity',
  'admin',
  'docs',
  'updates',
]);

/**
 * Редирект `/username` → `/@username`. Зарезервированные имена → 404.
 */
const ProfileUsernameRedirect: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  if (!username) return <NotFound />;

  const lower = username.toLowerCase();
  if (RESERVED.has(lower)) return <NotFound />;

  if (username.startsWith('@')) {
    return <NotFound />;
  }

  return <Navigate to={`/@${username}`} replace />;
};

export default ProfileUsernameRedirect;
