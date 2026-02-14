import React, { useEffect, useState } from 'react';
import {
  EntryNotification,
  LeaderboardEntry,
  LeaderboardPeriod,
  PremiumSubscription,
  UserProfile,
} from '../types';
import {
  adminUpdateBalance,
  getEntryNotification,
  getLeaderboardTop100,
  getPremiumRequests,
  getUser,
  resetWeeklyLeaderboard,
  reviewPremiumRequest,
  saveEntryNotification,
  setAppSetting,
} from '../services/storageService';

const Admin: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [coinAmt, setCoinAmt] = useState<number>(0);
  const [topUsers, setTopUsers] = useState<LeaderboardEntry[]>([]);
  const [period, setPeriod] = useState<LeaderboardPeriod>('weekly');
  const [premiumRequests, setPremiumRequests] = useState<PremiumSubscription[]>([]);
  const [logoUrl, setLogoUrl] = useState('');

  const [notif, setNotif] = useState<EntryNotification>(
    getEntryNotification() || {
      id: '1',
      title: '',
      description: '',
      buttonText: '',
      target: 'all',
      isActive: true,
      createdAt: '',
    },
  );

  const refreshAdminData = async () => {
    setCurrentUser(getUser());
    setPremiumRequests(getPremiumRequests().filter((item) => item.status === 'pending'));
    setTopUsers(await getLeaderboardTop100(period));
  };

  useEffect(() => {
    refreshAdminData();
  }, [period]);

  const handleUpdateBalances = () => {
    if (coinAmt === 0) return;
    adminUpdateBalance(0, coinAmt);
    setCoinAmt(0);
    refreshAdminData();
    alert("Foydalanuvchi balansi yangilandi!");
  };

  const handleSaveNotif = () => {
    saveEntryNotification(notif);
    alert('Kirish xabarnomasi yangilandi!');
  };

  const handleResetWeekly = async () => {
    resetWeeklyLeaderboard();
    await refreshAdminData();
    alert('Haftalik reyting reset qilindi.');
  };

  const handleApprovePremium = (id: string) => {
    reviewPremiumRequest(id, 'approved');
    refreshAdminData();
  };

  const handleRejectPremium = (id: string) => {
    reviewPremiumRequest(id, 'rejected');
    refreshAdminData();
  };

  const handleSaveLogo = () => {
    if (!logoUrl.trim()) return;
    setAppSetting('loading_logo', logoUrl.trim());
    setLogoUrl('');
    alert('Loading logo yangilandi!');
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto no-scrollbar space-y-8 animate-fade-in relative z-10 bg-slate-950">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-blue-600/5 blur-[100px] pointer-events-none"></div>

      <div className="flex justify-between items-end px-2 pt-4">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Boshqaruv</h1>
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Humo AI Central Command</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Foydalanuvchi</p>
          <p className="font-black text-white truncate">{currentUser?.name || "Noma'lum"}</p>
        </div>
        <div className="glass-card p-5 rounded-3xl border border-white/5 bg-slate-900/40">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ID</p>
          <p className="font-black text-blue-400 truncate">#{currentUser?.id.slice(-6)}</p>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-[40px] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">Balansni Tahrirlash</h3>
        <div className="space-y-3">
          <input
            type="number"
            value={coinAmt || ''}
            onChange={(e) => setCoinAmt(parseInt(e.target.value) || 0)}
            placeholder="Coins (+/-)"
            className="w-full bg-slate-900/80 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-yellow-500 font-black text-center"
          />
          <button onClick={handleUpdateBalances} className="w-full py-4 bg-white text-slate-950 rounded-[25px] font-black text-xs uppercase tracking-[0.2em]">
            Saqlash
          </button>
        </div>
      </div>

      <div className="glass-card p-6 rounded-[35px] border border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-sm uppercase tracking-widest">Reyting boshqaruvi</h3>
          <button onClick={handleResetWeekly} className="text-[10px] font-black uppercase bg-red-600 px-3 py-2 rounded-xl">Weekly reset</button>
        </div>
        <div className="flex gap-2 mb-4">
          {(['weekly', 'monthly', 'alltime'] as LeaderboardPeriod[]).map((item) => (
            <button key={item} onClick={() => setPeriod(item)} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${period === item ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {topUsers.slice(0, 100).map((entry) => (
            <div key={entry.userId} className="flex justify-between items-center bg-slate-900/70 rounded-xl p-3 border border-white/5">
              <p className="text-sm font-bold text-white">#{entry.rank} {entry.name}</p>
              <p className="text-sm font-black text-blue-300">{entry.xp} XP</p>
            </div>
          ))}
          {topUsers.length === 0 && <p className="text-sm text-slate-400">Reyting bo'sh.</p>}
        </div>
      </div>

      <div className="glass-card p-6 rounded-[35px] border border-yellow-500/20 bg-yellow-500/5">
        <h3 className="font-black text-sm uppercase tracking-widest mb-4">Premium pending requests</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {premiumRequests.map((item) => (
            <div key={item.id} className="bg-slate-900/70 rounded-xl p-3 border border-white/5">
              <p className="text-sm font-bold text-white">User #{item.userId.slice(-6)} • {item.planType}</p>
              <p className="text-xs text-slate-400 mb-3">{item.price.toLocaleString()} UZS</p>
              {item.proofImage && <img src={item.proofImage} alt="proof" className="w-full h-32 object-cover rounded-lg mb-2" />}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleApprovePremium(item.id)} className="bg-green-600 text-white rounded-lg py-2 text-xs font-black uppercase">Approve</button>
                <button onClick={() => handleRejectPremium(item.id)} className="bg-red-600 text-white rounded-lg py-2 text-xs font-black uppercase">Reject</button>
              </div>
            </div>
          ))}
          {premiumRequests.length === 0 && <p className="text-sm text-slate-400">Pending so'rovlar yo'q.</p>}
        </div>
      </div>

      <div className="glass-card p-6 rounded-[35px] border border-cyan-500/20 bg-cyan-500/5">
        <h3 className="font-black text-sm uppercase tracking-widest mb-3">Loading logo</h3>
        <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://.../logo.png" className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl" />
        <button onClick={handleSaveLogo} className="mt-3 w-full py-3 bg-cyan-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em]">Save logo</button>
      </div>

      <div className="glass-card p-7 rounded-[45px] border border-purple-500/20 bg-purple-500/5">
        <h3 className="font-black text-sm uppercase tracking-widest mb-6">Kirish Banneri</h3>
        <div className="space-y-5">
          <input type="text" value={notif.title} onChange={(e) => setNotif({ ...notif, title: e.target.value })} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl" />
          <textarea value={notif.description} onChange={(e) => setNotif({ ...notif, description: e.target.value })} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl h-24" />
          <div className="grid grid-cols-2 gap-3">
            <select value={notif.target} onChange={(e) => setNotif({ ...notif, target: e.target.value as any })} className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl">
              <option value="all">Hamma</option>
              <option value="has_coins">Boylar</option>
              <option value="no_coins">Yangi kelganlar</option>
            </select>
            <button onClick={handleSaveNotif} className="w-full py-4 bg-purple-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white">Yuborish</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
