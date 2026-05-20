import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import AuthModalShell from './AuthModalShell';
import { authInputClass, authSubmitClass } from './authFormStyles';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login } = useAuth();
  const { t } = useTranslation();
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
      const message = err instanceof Error ? err.message : t('auth.loginFailed');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthModalShell isOpen={isOpen} onClose={onClose} title={t('auth.loginTitle')}>
      <h2
        id="auth-modal-title"
        className="mb-6 text-center text-2xl font-bold text-neutral-900 sm:mb-8 sm:text-3xl"
      >
        {t('auth.welcomeBack')}
      </h2>

      {error && (
        <p className="mb-4 text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={(e) => void handleSubmit(e)}>
        <input
          type="email"
          placeholder={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${authInputClass} mb-4`}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`${authInputClass} mb-6`}
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading} className={authSubmitClass}>
          {loading ? t('auth.loggingIn') : t('auth.logIn')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        {t('auth.noAccount')}{' '}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-[#315efb] hover:underline"
        >
          {t('common.signUp')}
        </button>
      </p>
    </AuthModalShell>
  );
};

export default LoginModal;
