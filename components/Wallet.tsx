import React, { useState } from 'react';
import { UserProfile } from '../types';
import { isPremiumActive } from '../services/storageService';
import Premium from './Premium';

interface WalletProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
}

const Wallet: React.FC<WalletProps> = ({ user, onUpdateUser }) => {
  const [showPremium, setShowPremium] = useState(false);
  const isPremium = isPremiumActive(user);

  if (showPremium) {
    return <Premium user={user} onUpdateUser={onUpdateUser} onClose={() => setShowPremium(false)} />;
  }

  return (
    <div className="h-full w-full bg-[#0c1222] p-6 flex flex-col animate-fade-in overflow-y-auto pb-24">
      <div className="flex flex-col items-center mb-10 pt-10">
        <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 mb-4 shadow-2xl shadow-blue-500/10">
          <i className="fa-solid fa-wallet text-4xl text-blue-400"></i>
        </div>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Hamyon</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Sizning mablag'laringiz</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-6 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-3">
            <i className="fa-solid fa-coins text-yellow-500"></i>
          </div>
          <p className="text-2xl font-black text-white">{(user.coins || 0).toLocaleString()}</p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ravona Coins</p>
        </div>
        <div className="glass-card p-6 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <i className="fa-solid fa-bolt text-blue-400"></i>
          </div>
          <p className="text-2xl font-black text-white">{(user.xp || 0).toLocaleString()}</p>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tajriba (XP)</p>
        </div>
      </div>

      <div className="glass-card p-8 rounded-[40px] bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/30 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-4">
          <i className="fa-solid fa-crown text-blue-500/30 text-6xl rotate-12"></i>
        </div>
        <h3 className="text-xl font-black text-white italic mb-2">Premium Status</h3>
        <p className="text-xs text-slate-400 mb-6 max-w-[200px]">Barcha imkoniyatlarni oching va 2x XP multiplikatoriga ega bo'ling.</p>
        
        {isPremium ? (
          <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest inline-block border border-green-500/20">
            <i className="fa-solid fa-check mr-1.5"></i> Faol
          </div>
        ) : (
          <button 
            onClick={() => setShowPremium(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
          >
            Faollashtirish
          </button>
        )}
      </div>

      <div className="p-6 bg-white/5 rounded-[32px] border border-white/5">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">So'nggi Amallar</h4>
        <div className="space-y-4">
          <p className="text-xs text-slate-600 italic text-center py-4">Hozircha amallar mavjud emas.</p>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
