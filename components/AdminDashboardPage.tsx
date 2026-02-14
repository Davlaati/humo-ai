import React, { useEffect, useState } from 'react';

const ADMIN_TOKEN_KEY = 'admin_jwt_token';
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

interface PaymentRow {
  id: number;
  amount: number;
  currency: string;
  status: string;
  user_id: number;
  mode: string;
  created_at: string;
}

const AdminDashboardPage: React.FC = () => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const [verifying, setVerifying] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerifying(false);
        setIsAuthorized(false);
        return;
      }

      try {
        const [meRes, statsRes, paymentsRes, usersRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/me`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/admin/payments`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!meRes.ok) {
          setIsAuthorized(false);
          return;
        }

        setIsAuthorized(true);

        if (statsRes.ok) setStats((await statsRes.json()).stats);
        if (paymentsRes.ok) setPayments((await paymentsRes.json()).payments || []);
        if (usersRes.ok) setUsers((await usersRes.json()).users || []);
      } catch {
        setIsAuthorized(false);
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [token]);

  if (!token) {
    window.location.replace('/admin');
    return null;
  }

  if (!verifying && !isAuthorized) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.replace('/');
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.location.replace('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
          <button onClick={handleLogout} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold hover:bg-red-500">Logout</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900 p-3 rounded-xl border border-white/10"><p className="text-xs text-slate-400">Users</p><p className="text-xl font-black">{stats?.usersCount ?? '-'}</p></div>
          <div className="bg-slate-900 p-3 rounded-xl border border-white/10"><p className="text-xs text-slate-400">Payments</p><p className="text-xl font-black">{stats?.paymentsCount ?? '-'}</p></div>
          <div className="bg-slate-900 p-3 rounded-xl border border-white/10"><p className="text-xs text-slate-400">Paid</p><p className="text-xl font-black">{stats?.paidPaymentsCount ?? '-'}</p></div>
          <div className="bg-slate-900 p-3 rounded-xl border border-white/10"><p className="text-xs text-slate-400">Stars sold</p><p className="text-xl font-black">{stats?.totalStarsSold ?? '-'}</p></div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 border-b border-white/10 font-bold">Users balances</div>
          <div className="max-h-[260px] overflow-y-auto">{users.length === 0 ? <p className="p-4 text-slate-400 text-sm">No users yet.</p> : users.map((u) => <div key={u.id} className="p-3 border-b border-white/5 text-sm flex items-center justify-between"><p>@{u.username || u.telegram_id}</p><p className="font-bold">{u.balance_stars} ⭐</p></div>)}</div>
        </div>
        <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 border-b border-white/10 font-bold">Payments</div>
          <div className="max-h-[420px] overflow-y-auto">{payments.length === 0 ? <p className="p-4 text-slate-400 text-sm">No payments yet.</p> : payments.map((p) => <div key={p.id} className="p-3 border-b border-white/5 text-sm flex items-center justify-between gap-2"><div><p className="font-semibold">#{p.id} • User {p.user_id}</p><p className="text-slate-400">{p.amount} {p.currency} • {p.mode} • {new Date(p.created_at).toLocaleString()}</p></div><span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'paid' ? 'bg-green-600' : p.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'}`}>{p.status}</span></div>)}</div>
        </div>
        <p className="text-xs text-slate-500">{verifying ? 'Sessiya tekshirilmoqda...' : 'Admin sessiyasi faol.'}</p>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
