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
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [pendingSubs, setPendingSubs] = useState<any[]>([]);
  const [loadingLogo, setLoadingLogo] = useState<string>('');

  const authedFetch = (path: string, options: RequestInit = {}) =>
    fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });

  const loadData = async () => {
    if (!token) return;
    const [meRes, statsRes, paymentsRes, usersRes, topRes, pendingSubsRes] = await Promise.all([
      authedFetch('/api/admin/me'),
      authedFetch('/api/admin/stats'),
      authedFetch('/api/admin/payments'),
      authedFetch('/api/admin/users'),
      fetch(`${API_BASE}/api/public/leaderboard?period=alltime&limit=100`),
      authedFetch('/api/admin/subscriptions/pending'),
    ]);

    if (!meRes.ok) {
      setIsAuthorized(false);
      return;
    }

    setIsAuthorized(true);
    if (statsRes.ok) setStats((await statsRes.json()).stats);
    if (paymentsRes.ok) setPayments((await paymentsRes.json()).payments || []);
    if (usersRes.ok) setUsers((await usersRes.json()).users || []);
    if (topRes.ok) setTopUsers((await topRes.json()).data || []);
    if (pendingSubsRes.ok) setPendingSubs((await pendingSubsRes.json()).subscriptions || []);
  };

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerifying(false);
        setIsAuthorized(false);
        return;
      }

      try {
        await loadData();
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

  const handleResetWeekly = async () => {
    await authedFetch('/api/admin/leaderboard/reset-weekly', { method: 'POST' });
    await loadData();
    alert('Weekly leaderboard reset qilindi');
  };

  const handleReviewSub = async (id: number, action: 'approve' | 'reject') => {
    await authedFetch(`/api/admin/subscriptions/${id}/${action}`, { method: 'POST' });
    await loadData();
  };

  const handleSaveLoadingLogo = async () => {
    if (!loadingLogo) return;
    await authedFetch('/api/admin/settings/loading-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ imageUrl: loadingLogo }),
    });
    alert('Loading logo saqlandi');
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
          <div className="bg-slate-900 p-3 rounded-xl border border-white/10"><p className="text-xs text-slate-400">Pending premium</p><p className="text-xl font-black">{stats?.pendingSubscriptions ?? '-'}</p></div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-white/10 p-4 space-y-3">
          <h3 className="font-bold">Loading logo setting</h3>
          <input value={loadingLogo} onChange={(e) => setLoadingLogo(e.target.value)} placeholder="https://...logo.png" className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleSaveLoadingLogo} className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-bold">Save loading logo</button>
        </div>

        <div className="bg-slate-900 rounded-xl border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">Top 100 leaderboard (all-time)</h3>
            <button onClick={handleResetWeekly} className="px-3 py-2 bg-yellow-600 rounded-lg text-xs font-bold uppercase">Reset weekly</button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1">
            {topUsers.map((u: any) => (
              <div key={u.userId} className="flex items-center justify-between text-sm border-b border-white/5 py-2">
                <span>#{u.rank} {u.name}</span>
                <span className="font-bold">{u.xp} pt</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl border border-white/10 p-4 space-y-2">
          <h3 className="font-bold">Pending subscriptions</h3>
          {pendingSubs.length === 0 ? <p className="text-slate-400 text-sm">No pending subscriptions</p> : pendingSubs.map((sub: any) => (
            <div key={sub.id} className="border border-white/10 rounded-lg p-3 space-y-2">
              <p className="text-sm">#{sub.id} • {sub.plan_type} • {sub.price} UZS</p>
              {sub.proof_image && <img src={sub.proof_image} alt="proof" className="w-full h-36 object-cover rounded" />}
              <div className="flex gap-2">
                <button onClick={() => handleReviewSub(sub.id, 'approve')} className="px-3 py-2 bg-green-600 rounded text-xs font-bold">Approve</button>
                <button onClick={() => handleReviewSub(sub.id, 'reject')} className="px-3 py-2 bg-red-600 rounded text-xs font-bold">Reject</button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
          <div className="p-3 border-b border-white/10 font-bold">Users balances</div>
          <div className="max-h-[260px] overflow-y-auto">{users.length === 0 ? <p className="p-4 text-slate-400 text-sm">No users yet.</p> : users.map((u) => <div key={u.id} className="p-3 border-b border-white/5 text-sm flex items-center justify-between"><p>@{u.username || u.telegram_id}</p><p className="font-bold">{u.balance_stars} ⭐ • {u.points_total} pt</p></div>)}</div>
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
