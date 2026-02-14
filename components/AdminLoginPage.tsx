import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'admin_jwt_token';

function getTelegramUserId(): string | null {
  const telegramIdFromWebApp = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (telegramIdFromWebApp) return String(telegramIdFromWebApp);

  // Web-admin fallback for testing outside Telegram
  const urlParam = new URLSearchParams(window.location.search).get('tg_id');
  if (urlParam) return urlParam;

  return null;
}

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error' | 'idle'>('loading');
  const [error, setError] = useState('');

  const existingToken = localStorage.getItem(ADMIN_TOKEN_KEY);
  const telegramId = useMemo(() => getTelegramUserId(), []);

  useEffect(() => {
    document.title = 'HUMO AI Admin Login';
  }, []);

  useEffect(() => {
    if (existingToken) return;

    const autoLogin = async () => {
      if (!telegramId) {
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError('');

      try {
        const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
        const response = await fetch(`${apiBase}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId }),
        });

        const payload = await response.json().catch(() => ({}));

        if (!response.ok || !payload?.success || !payload?.token) {
          setStatus('error');
          setError('Admin access denied');
          return;
        }

        localStorage.setItem(ADMIN_TOKEN_KEY, payload.token);
        navigate('/admin/dashboard', { replace: true });
      } catch {
        setStatus('error');
        setError('Login service unavailable');
      }
    };

    autoLogin();
  }, [existingToken, navigate, telegramId]);

  if (existingToken) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (status === 'idle') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
        <h1 className="text-2xl font-black tracking-tight">Admin Access</h1>
        <p className="text-slate-400 text-sm mt-2">
          {status === 'loading' ? 'Telegram ID tekshirilmoqda...' : 'Admin login muvaffaqiyatsiz.'}
        </p>

        {status === 'error' && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <button
          onClick={() => navigate('/', { replace: true })}
          className="mt-6 w-full rounded-xl bg-slate-700 py-3 font-bold hover:bg-slate-600"
        >
          Mini App Home
        </button>
      </div>
    </div>
  );
};

export default AdminLoginPage;
