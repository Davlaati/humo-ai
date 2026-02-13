
import React, { useState, useEffect } from 'react';
import { Transaction, UserProfile, EntryNotification } from '../types';
import { getTransactions, getUser, adminUpdateBalance, getEntryNotification, saveEntryNotification } from '../services/storageService';

const Admin: React.FC = () => {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Balans boshqaruvi
  const [starAmt, setStarAmt] = useState<number>(0);
  const [coinAmt, setCoinAmt] = useState<number>(0);

  // Notification states
  const [notif, setNotif] = useState<EntryNotification>(getEntryNotification() || {
    id: '1', title: '', description: '', buttonText: '', target: 'all', isActive: true, createdAt: ''
  });

  useEffect(() => {
    const interval = setInterval(() => {
        setTxs(getTransactions().reverse());
        setCurrentUser(getUser());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateBalances = () => {
      if (starAmt === 0 && coinAmt === 0) return;
      adminUpdateBalance(starAmt, coinAmt);
      setStarAmt(0);
      setCoinAmt(0);
      alert("Foydalanuvchi balansi muvaffaqiyatli o'zgartirildi!");
  };

  const handleSaveNotif = () => {
      saveEntryNotification(notif);
      alert("Kirish xabarnomasi yangilandi!");
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto no-scrollbar space-y-8 animate-fade-in relative z-10 bg-slate-950">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-blue-600/5 blur-[100px] pointer-events-none"></div>

      <div className="flex justify-between items-end px-2 pt-4">
        <div>
           <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Boshqaruv</h1>
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">Humo AI Central Command</p>
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
           <i className="fa-solid fa-gears text-slate-500"></i>
        </div>
      </div>

      {/* Statistics Quick View */}
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

      {/* Balance Command Center */}
      <div className="glass-panel p-6 rounded-[40px] border border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <i className="fa-solid fa-piggy-bank text-6xl"></i>
          </div>
          
          <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center">
             <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
             Balansni Tahrirlash
          </h3>
          
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Stars (+/-)</label>
                      <input 
                        type="number"
                        value={starAmt || ''}
                        onChange={(e) => setStarAmt(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-slate-900/80 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-blue-500 font-black text-center"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Coins (+/-)</label>
                      <input 
                        type="number"
                        value={coinAmt || ''}
                        onChange={(e) => setCoinAmt(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-slate-900/80 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-yellow-500 font-black text-center"
                      />
                  </div>
              </div>
              
              <button 
                onClick={handleUpdateBalances}
                className="w-full py-5 bg-white text-slate-950 rounded-[25px] font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition shadow-xl"
              >
                O'zgarishlarni Saqlash
              </button>
          </div>
      </div>

      {/* Marketing Tools */}
      <div className="glass-card p-7 rounded-[45px] border border-purple-500/20 bg-purple-500/5">
          <h3 className="font-black text-sm uppercase tracking-widest mb-6 flex items-center">
             <i className="fa-solid fa-bullhorn text-purple-400 mr-2"></i> Kirish Banneri
          </h3>
          <div className="space-y-5">
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Sarlavha</label>
                  <input 
                    type="text"
                    value={notif.title}
                    onChange={(e) => setNotif({...notif, title: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-purple-500 font-bold"
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Xabar matni</label>
                  <textarea 
                    value={notif.description}
                    onChange={(e) => setNotif({...notif, description: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl focus:outline-none focus:border-purple-500 text-sm h-28"
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Target</label>
                    <select 
                        value={notif.target}
                        onChange={(e) => setNotif({...notif, target: e.target.value as any})}
                        className="w-full bg-slate-900 border border-white/10 p-4 rounded-2xl focus:outline-none font-bold text-xs"
                    >
                        <option value="all">Hamma</option>
                        <option value="has_coins">Boylar</option>
                        <option value="no_coins">Yangi kelganlar</option>
                    </select>
                  </div>
                  <div className="space-y-1 flex flex-col justify-end">
                      <button onClick={handleSaveNotif} className="w-full py-4 bg-purple-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition text-white">Yuborish</button>
                  </div>
              </div>
          </div>
      </div>
      
      <div className="h-20"></div>
    </div>
  );
};

export default Admin;
