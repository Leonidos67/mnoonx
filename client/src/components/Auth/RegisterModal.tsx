import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthModalShell from './AuthModalShell';
import { authInputClass, authSubmitClass } from './authFormStyles';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setUsername('');
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
      await register(username, email, password, username);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title="Create account">
      <h2
        id="auth-modal-title"
        className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:mb-8 sm:text-3xl"
      >
        Create account
      </h2>

      {error && (
        <p className="mb-4 text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 sm:space-y-5">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={authInputClass}
          autoComplete="username"
          required
        />
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={authInputClass}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={authInputClass}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-[#315efb] hover:underline"
        >
          Log in
        </button>
      </p>
    </AuthModalShell>
  );
};

export default RegisterModal;
