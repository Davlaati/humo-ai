
import React, { useState, useEffect } from 'react';
import { Transaction, UserProfile, EntryNotification } from '../types';
import { getTransactions, updateTransactionStatus, getUser, adminAdjustStars, getEntryNotification, saveEntryNotification } from '../services/storageService';

const Admin: React.FC = () => {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(0);

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

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    updateTransactionStatus(id, action);
  };

  const handleAdjustStars = (type: 'admin_bonus' | 'admin_deduction') => {
      if (adjustAmount <= 0) return;
      const amt = type === 'admin_bonus' ? adjustAmount : -adjustAmount;
      adminAdjustStars(currentUser?.id || '', amt, type);
      setAdjustAmount(0);
      alert("Balans o'zgartirildi!");
  };

  const handleSaveNotif = () => {
      saveEntryNotification(notif);
      alert("Xabarnoma saqlandi!");
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto no-scrollbar space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-blue-400">Master Admin</h1>
        <span className="px-3 py-1 bg-white/5 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/5">v2.0</span>
      </div>

      {/* Entry Notification Management */}
      <div className="glass-card p-6 rounded-3xl border border-purple-500/20 bg-purple-500/5">
          <h3 className="font-bold text-lg mb-4 flex items-center">
             <i className="fa-solid fa-bell text-purple-400 mr-2"></i> Kirish Xabarnomasi
          </h3>
          <div className="space-y-4">
              <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Sarlavha (Katta matn)</label>
                  <input 
                    type="text"
                    value={notif.title}
                    onChange={(e) => setNotif({...notif, title: e.target.value})}
                    placeholder="$ 100"
                    className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-purple-500 font-bold mt-1"
                  />
              </div>
              <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Tavsif</label>
                  <textarea 
                    value={notif.description}
                    onChange={(e) => setNotif({...notif, description: e.target.value})}
                    placeholder="Xabar matni..."
                    className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-purple-500 text-sm mt-1 h-24"
                  />
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Tugma matni</label>
                    <input 
                        type="text"
                        value={notif.buttonText}
                        onChange={(e) => setNotif({...notif, buttonText: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-purple-500 font-bold mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Kim uchun?</label>
                    <select 
                        value={notif.target}
                        onChange={(e) => setNotif({...notif, target: e.target.value as any})}
                        className="w-full bg-slate-900 border border-white/10 p-3 rounded-xl focus:outline-none focus:border-purple-500 font-bold mt-1 text-xs"
                    >
                        <option value="all">Hamma</option>
                        <option value="has_coins">Coini borlar</option>
                        <option value="no_coins">Coini yo'qlar</option>
                    </select>
                  </div>
              </div>
              <button onClick={handleSaveNotif} className="w-full py-4 bg-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition shadow-lg shadow-purple-600/20">Saqlash va Faollashtirish</button>
          </div>
      </div>
      
      {/* Stars Management */}
      <div className="glass-card p-6 rounded-3xl border border-blue-500/30 bg-blue-500/5">
          <h3 className="font-bold text-lg mb-4 flex items-center">
             <i className="fa-solid fa-star text-blue-400 mr-2"></i> Stars Management
          </h3>
          
          <div className="flex items-center justify-between mb-6 p-4 bg-white/5 rounded-2xl">
             <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Tanlangan Foydalanuvchi</p>
                <p className="font-bold text-white">{currentUser?.name}</p>
             </div>
             <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Balans</p>
                <p className="font-black text-blue-400">{currentUser?.telegramStars || 0} XTR</p>
             </div>
          </div>

          <div className="space-y-4">
              <input 
                type="number"
                value={adjustAmount || ''}
                onChange={(e) => setAdjustAmount(parseInt(e.target.value))}
                placeholder="Miqdorni kiriting..."
                className="w-full bg-slate-900 border border-white/10 p-4 rounded-xl focus:outline-none focus:border-blue-500 font-bold"
              />
              <div className="flex space-x-3">
                  <button onClick={() => handleAdjustStars('admin_bonus')} className="flex-1 py-3 bg-green-600 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition">Stars Qo'shish</button>
                  <button onClick={() => handleAdjustStars('admin_deduction')} className="flex-1 py-3 bg-red-600 rounded-xl font-bold text-xs uppercase tracking-widest active:scale-95 transition">Stars Ayirish</button>
              </div>
          </div>
      </div>

      {/* Fiat Transactions */}
      <div className="space-y-4">
          <h3 className="font-black text-xs uppercase tracking-widest text-gray-500">To'lov So'rovlari (Fiat)</h3>
          <div className="space-y-3">
            {txs.length > 0 ? txs.map(tx => (
                <div key={tx.id} className="glass-panel p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold">{tx.username}</span>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-black ${tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : tx.status === 'approved' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            {tx.status.toUpperCase()}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mb-4">
                        <span>{tx.amount} HC</span>
                        <span>{tx.cost.toLocaleString()} UZS</span>
                    </div>
                    {tx.status === 'pending' && (
                        <div className="flex space-x-2">
                            <button onClick={() => handleAction(tx.id, 'approved')} className="flex-1 bg-green-600 hover:bg-green-500 py-2 rounded-lg text-[10px] font-black uppercase">Approve</button>
                            <button onClick={() => handleAction(tx.id, 'rejected')} className="flex-1 bg-red-600 hover:bg-red-500 py-2 rounded-lg text-[10px] font-black uppercase">Reject</button>
                        </div>
                    )}
                </div>
            )) : <p className="text-center text-gray-600 text-xs py-10">To'lovlar mavjud emas.</p>}
          </div>
      </div>
    </div>
  );
};

export default Admin;
