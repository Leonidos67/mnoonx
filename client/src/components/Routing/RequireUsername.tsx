import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const USERS_DIRECTORY_ALLOWED_USERNAME = 'malvinalord';

interface RequireUsernameProps {
  username: string;
  children: React.ReactNode;
}

const RequireUsername: React.FC<RequireUsernameProps> = ({ username, children }) => {
  const { user, loading } = useAuth();
  const allowed = username.trim().toLowerCase();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!user || user.username.toLowerCase() !== allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

/** Only @malvinalord can open /users (user directory). */
export const RequireUsersDirectoryAccess: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RequireUsername username={USERS_DIRECTORY_ALLOWED_USERNAME}>{children}</RequireUsername>
);

export default RequireUsername;
