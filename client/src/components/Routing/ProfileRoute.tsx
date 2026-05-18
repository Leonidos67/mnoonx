import React from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../Layout/AppLayout';
import UserProfile from '../../pages/UserProfile';
import NotFound from '../../pages/NotFound';
import ProfileUsernameRedirect from './ProfileUsernameRedirect';
import RequireAuth from './RequireAuth';

/**
 * Один сегмент `/:username`: `/@name` → профиль, иначе редирект на `/@name` или 404.
 * (Маршрут `/@:username` в React Router не матчится с путём `/@name`, из‑за этого был бесконечный Navigate.)
 */
const ProfileRoute: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  if (!username) return <NotFound />;

  if (username.startsWith('@')) {
    return (
      <AppLayout>
        <RequireAuth>
          <UserProfile />
        </RequireAuth>
      </AppLayout>
    );
  }

  return <ProfileUsernameRedirect />;
};

export default ProfileRoute;
