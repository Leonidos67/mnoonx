import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLogin: React.FC = () => {
  const { token, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen max-h-dvh items-center justify-center overflow-y-auto bg-[#0b0d12] px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#141820] p-8 shadow-2xl">
        {/* <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600/20 text-violet-300">
            <Shield size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Вход в админку</h1>
            <p className="text-sm text-neutral-500">MNOONX</p>
          </div>
        </div> */}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-400">Логин</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-2.5 text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-400">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-[#0b0d12] px-4 py-2.5 text-white outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
              required
            />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            {submitting ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
