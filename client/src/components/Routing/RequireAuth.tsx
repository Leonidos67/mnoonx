import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, token, loading } = useAuth();

  useEffect(() => {
    if (!loading && !token) {
      window.dispatchEvent(new CustomEvent('openLogin'));
    }
  }, [loading, token]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-black" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-semibold text-neutral-900">Sign in required</p>
        <p className="mt-2 max-w-sm text-sm text-neutral-500">
          You need to be signed in to view this page.
        </p>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('openLogin'))}
          className="mt-6 rounded-xl bg-black px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Sign in
        </button>
        <Link to="/" className="mt-4 text-sm font-medium text-[#315efb] hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;
