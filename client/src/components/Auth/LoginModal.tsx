import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthModalShell from './AuthModalShell';
import { authInputClass, authSubmitClass } from './authFormStyles';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title="Log in">
      <h2
        id="auth-modal-title"
        className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:mb-8 sm:text-3xl"
      >
        Welcome back
      </h2>

      {error && (
        <p className="mb-4 text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${authInputClass} mb-4`}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${authInputClass} mb-6`}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-[#315efb] hover:underline"
        >
          Sign up
        </button>
      </p>
    </AuthModalShell>
  );
};

export default LoginModal;
