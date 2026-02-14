import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

const ADMIN_TOKEN_KEY = 'admin_jwt_token';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  if (!token) {
    return <Navigate to="/admin" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    navigate('/admin', { replace: true });
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
        <p className="text-slate-300 mt-4">Siz admin tizimiga muvaffaqiyatli kirdingiz.</p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
