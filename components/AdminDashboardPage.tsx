import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'admin_jwt_token';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const [verifying, setVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerifying(false);
        setIsAuthorized(false);
        return;
      }

      try {
        const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
        const response = await fetch(`${apiBase}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAuthorized(response.ok);
      } catch {
        setIsAuthorized(false);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  if (!verifying && !isAuthorized) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    return <Navigate to="/" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-500"
          >
            Logout
          </button>
        </div>
        <p className="text-slate-300 mt-4">
          {verifying ? 'Sessiya tekshirilmoqda...' : 'Telegram admin sessiyasi faol.'}
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
